import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAuthedUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  const supabase = adminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { user, token };
}

async function ensureProfile(userId: string, fallback: { email?: string; name?: string; type?: string; verified?: boolean; onboarding_completed?: boolean }) {
  const supabase = adminClient();
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (existing) return existing;
  const profile = {
    id: userId,
    email: fallback.email ?? "",
    full_name: fallback.name ?? "Utilizador",
    type: (fallback.type ?? "student") as "student" | "landlord" | "admin",
    verified: fallback.verified ?? false,
    onboarding_completed: fallback.onboarding_completed ?? false,
  };
  const { data, error } = await supabase.from("profiles").insert(profile).select().single();
  if (error) {
    console.log(`ensureProfile insert error for ${userId}: ${error.message}`);
    return profile;
  }
  return data;
}

app.get("/make-server-08c694dc/health", (c) => c.json({ status: "ok" }));

// Public config endpoint — exposes the anon key (a public key) so the frontend
// can bootstrap itself when the connected Supabase project changes.
// No auth check: the anon key is intentionally public.
app.get("/make-server-08c694dc/public-config", (c) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ??
    "";
  return c.json({ supabaseUrl, anonKey });
});

app.post("/make-server-08c694dc/auth/register", async (c) => {
  try {
    const { email, password, name, type } = await c.req.json();
    if (!email || !password || !name || !type) return c.json({ error: "Missing required fields" }, 400);
    const supabase = adminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { name, full_name: name, type },
      email_confirm: true,
    });
    if (error) return c.json({ error: error.message }, 400);
    const userId = data.user.id;
    const profile = await ensureProfile(userId, { email, name, type });
    if (type === "student") {
      await supabase.from("personal_profiles").upsert({ user_id: userId, full_name: name }, { onConflict: "user_id" });
    }
    return c.json({ success: true, profile });
  } catch (err) {
    console.log(`Registration error: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/make-server-08c694dc/auth/profile", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);
    const profile = await ensureProfile(authed.user.id, {
      email: authed.user.email,
      name: authed.user.user_metadata?.full_name || authed.user.user_metadata?.name,
      type: authed.user.user_metadata?.type,
    });
    return c.json({ profile });
  } catch (err) {
    console.log(`Profile error: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/make-server-08c694dc/auth/onboarding", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const supabase = adminClient();
    const sp = body.studentProfile || {};
    if (sp.personal) await supabase.from("personal_profiles").upsert({ user_id: authed.user.id, ...sp.personal }, { onConflict: "user_id" });
    if (sp.lifestyle) await supabase.from("lifestyle_profiles").upsert({ user_id: authed.user.id, ...sp.lifestyle }, { onConflict: "user_id" });
    if (sp.preferences) await supabase.from("accommodation_preferences").upsert({ user_id: authed.user.id, ...sp.preferences }, { onConflict: "user_id" });
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", authed.user.id);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Onboarding error: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =========================================================
// DEMO SEED
// =========================================================
const DEMO_IMG_PROPERTY = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800";
const DEMO_IMG_ROOM = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";

async function seedDemoUsers() {
  const supabase = adminClient();
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.log(`Seed list error: ${listError.message}`); return null; }
  const existingByEmail = new Map(listData.users.map((u: { id: string; email: string }) => [u.email, u.id]));

  const demoUsers = [
    { email: "estudante@uniroom.pt", password: "password123", name: "João Silva", type: "student", verified: true, onboarding_completed: true },
    { email: "senhorio@uniroom.pt", password: "password123", name: "Maria Santos", type: "landlord", verified: true, onboarding_completed: true },
    { email: "admin@uniroom.pt", password: "password123", name: "Admin UniRoom", type: "admin", verified: true, onboarding_completed: true },
  ];

  const ids: Record<string, string> = {};
  for (const u of demoUsers) {
    let userId = existingByEmail.get(u.email) as string | undefined;
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email, password: u.password,
        user_metadata: { name: u.name, full_name: u.name, type: u.type },
        email_confirm: true,
      });
      if (error) { console.log(`Seed create ${u.email}: ${error.message}`); continue; }
      userId = data.user.id;
    }
    await supabase.from("profiles").upsert({
      id: userId, email: u.email, full_name: u.name, type: u.type,
      verified: u.verified, onboarding_completed: u.onboarding_completed,
    }, { onConflict: "id" });
    if (u.type === "student") await supabase.from("personal_profiles").upsert({ user_id: userId, full_name: u.name }, { onConflict: "user_id" });
    ids[u.type] = userId;
  }
  return ids;
}

async function seedDemoContent(ids: Record<string, string>) {
  const supabase = adminClient();
  const landlordId = ids.landlord;
  const studentId = ids.student;
  if (!landlordId || !studentId) return;

  const { data: existing } = await supabase.from("properties").select("id").eq("landlord_id", landlordId).limit(1);
  if (existing && existing.length > 0) { console.log("Demo content already seeded"); return; }

  const baseAmen = { wifi: true, parking: false, gym: false, laundry: true, kitchen: true, livingRoom: true, backyard: false, airConditioning: true, heating: true, dishwasher: true, microwave: true, elevator: false };

  const properties = [
    { id: "prop-1", title: "Apartamento T3 - Marquês de Pombal", city: "Lisboa", zone: "Marquês de Pombal", address: "Av. da Liberdade 200", distance: 1.5, totalRooms: 3, status: "active" },
    { id: "prop-2", title: "Casa em Benfica - Perto da FCUL", city: "Lisboa", zone: "Benfica", address: "Rua da Universidade 45", distance: 0.8, totalRooms: 4, status: "active" },
    { id: "prop-3", title: "T2 moderno no Porto - Boavista", city: "Porto", zone: "Boavista", address: "Av. da Boavista 1500", distance: 2.0, totalRooms: 2, status: "active" },
    { id: "prop-4", title: "Casa partilhada - Coimbra Centro", city: "Coimbra", zone: "Sé Velha", address: "Rua Larga 10", distance: 0.5, totalRooms: 4, status: "active" },
    { id: "prop-5", title: "Apartamento renovado - Aveiro", city: "Aveiro", zone: "Glicínias", address: "Rua das Glicínias 20", distance: 1.2, totalRooms: 3, status: "draft" },
    { id: "prop-6", title: "Estúdio em Braga", city: "Braga", zone: "Centro", address: "Rua do Souto 88", distance: 0.7, totalRooms: 1, status: "paused" },
  ];

  for (const p of properties) {
    await supabase.from("properties").insert({
      id: p.id, landlord_id: landlordId, title: p.title,
      description: `Excelente ${p.title.toLowerCase()}, totalmente mobilado, ideal para estudantes universitários. Próximo de transportes públicos e supermercados.`,
      address: p.address, city: p.city, zone: p.zone, distance_to_university: p.distance,
      coordinates: { lat: 38.7223, lng: -9.1393 }, images: [DEMO_IMG_PROPERTY],
      amenities: baseAmen,
      house_rules: { smoking: false, pets: false, parties: false, studentsOnly: true, quietHours: "22h-08h", preferredGender: "any" },
      total_rooms: p.totalRooms, whole_property_available: false,
      status: p.status, verified: p.status === "active", views: Math.floor(Math.random() * 200) + 50,
    });
  }

  const rooms = [
    { id: "room-1", prop: "prop-1", num: "Quarto 1", title: "Quarto com vista para o jardim", price: 380, status: "available" },
    { id: "room-2", prop: "prop-1", num: "Quarto 2", title: "Quarto interior tranquilo", price: 340, status: "available" },
    { id: "room-3", prop: "prop-1", num: "Quarto 3", title: "Quarto suite com WC privado", price: 450, status: "occupied", occupiedBy: studentId },
    { id: "room-4", prop: "prop-2", num: "Quarto 1", title: "Quarto duplo amplo", price: 360, status: "available" },
    { id: "room-5", prop: "prop-2", num: "Quarto 2", title: "Quarto individual com varanda", price: 400, status: "reserved", reservedBy: studentId },
    { id: "room-6", prop: "prop-2", num: "Quarto 3", title: "Quarto pequeno acolhedor", price: 290, status: "available" },
    { id: "room-7", prop: "prop-2", num: "Quarto 4", title: "Quarto com escritório", price: 420, status: "available" },
    { id: "room-8", prop: "prop-3", num: "Quarto 1", title: "Quarto luminoso", price: 350, status: "available" },
    { id: "room-9", prop: "prop-3", num: "Quarto 2", title: "Quarto suite premium", price: 480, status: "available" },
    { id: "room-10", prop: "prop-4", num: "Quarto 1", title: "Quarto histórico no centro", price: 280, status: "available" },
    { id: "room-11", prop: "prop-4", num: "Quarto 2", title: "Quarto com vista para a Sé", price: 320, status: "available" },
    { id: "room-12", prop: "prop-4", num: "Quarto 3", title: "Quarto duplo partilhado", price: 220, status: "available" },
  ];

  for (const r of rooms) {
    await supabase.from("rooms").insert({
      id: r.id, property_id: r.prop, landlord_id: landlordId,
      room_number: r.num, title: r.title,
      description: `${r.title}. Mobilado, com secretária, roupeiro e cama de casal. Pronto a habitar.`,
      images: [DEMO_IMG_ROOM], size: 12 + Math.floor(Math.random() * 8),
      room_type: "private", max_occupants: 1,
      private_bathroom: r.title.includes("suite"), balcony: r.title.includes("varanda"),
      desk: true, wardrobe: true, air_conditioning: true,
      price: r.price, utilities: 30,
      available_from: "2026-09-01", minimum_stay: 6,
      status: r.status,
      reserved_by: (r as any).reservedBy ?? null,
      occupied_by: (r as any).occupiedBy ?? null,
      move_in_date: (r as any).occupiedBy ? "2026-02-01" : null,
      views: Math.floor(Math.random() * 100) + 10,
    });
  }

  // Active home for student (room-3)
  await supabase.from("active_homes").insert({
    id: "home-1", student_id: studentId, property_id: "prop-1", room_id: "room-3",
    landlord_id: landlordId, move_in_date: "2026-02-01", contract_end_date: "2026-08-31",
    payment_day: 5, monthly_rent: 450, utilities: 30,
  });

  // Applications
  const applications = [
    { id: "app-1", room: "room-1", prop: "prop-1", status: "pending", message: "Olá! Estou muito interessado neste quarto." },
    { id: "app-2", room: "room-5", prop: "prop-2", status: "accepted", message: "Gostava muito de marcar uma visita." },
    { id: "app-3", room: "room-8", prop: "prop-3", status: "under_review", message: "Disponível para me mudar em setembro." },
  ];
  for (const a of applications) {
    await supabase.from("applications").insert({
      id: a.id, user_id: studentId, room_id: a.room, property_id: a.prop,
      landlord_id: landlordId, status: a.status, message: a.message,
      move_in_date: "2026-09-01",
    });
  }

  // Conversation + messages
  await supabase.from("conversations").insert({ id: "conv-1", property_id: "prop-1", room_id: "room-1" });
  await supabase.from("conversation_participants").insert([
    { conversation_id: "conv-1", user_id: studentId },
    { conversation_id: "conv-1", user_id: landlordId },
  ]);
  await supabase.from("messages").insert([
    { id: "msg-1", conversation_id: "conv-1", sender_id: studentId, content: "Olá Maria, ainda está disponível o quarto?", read: true },
    { id: "msg-2", conversation_id: "conv-1", sender_id: landlordId, content: "Olá João, sim ainda está! Quando gostaria de visitar?", read: true },
    { id: "msg-3", conversation_id: "conv-1", sender_id: studentId, content: "Que tal na próxima quinta-feira às 18h?", read: false },
  ]);

  // Maintenance
  await supabase.from("maintenance_requests").insert([
    { id: "maint-1", user_id: studentId, property_id: "prop-1", room_id: "room-3", landlord_id: landlordId,
      category: "plumbing", title: "Torneira da cozinha a pingar", description: "A torneira está a pingar há dois dias.",
      urgency: "medium", status: "pending" },
    { id: "maint-2", user_id: studentId, property_id: "prop-1", room_id: "room-3", landlord_id: landlordId,
      category: "internet", title: "Wi-Fi muito lento", description: "Internet a falhar à noite.",
      urgency: "low", status: "in_progress" },
  ]);

  // Notifications
  await supabase.from("notifications").insert([
    { id: "notif-1", user_id: studentId, type: "application_update", title: "Candidatura aceite", message: "A tua candidatura foi aceite!", read: false },
    { id: "notif-2", user_id: studentId, type: "message", title: "Nova mensagem de Maria Santos", message: "Quando gostaria de visitar?", read: false },
    { id: "notif-3", user_id: landlordId, type: "application_update", title: "Nova candidatura", message: "João Silva candidatou-se a um quarto.", read: false },
  ]);

  // Verification + trust for landlord and student
  await supabase.from("verification_status").upsert([
    { user_id: landlordId, level: "gold", email_verified: true, university_email_verified: false, document_verified: true, photo_verified: true, verified_at: new Date().toISOString() },
    { user_id: studentId, level: "silver", email_verified: true, university_email_verified: true, document_verified: false, photo_verified: true },
  ]);
  await supabase.from("trust_scores").upsert([
    { user_id: landlordId, level: "trusted", score: 92, verification_level: "gold", reviews_count: 18, average_rating: 4.7, response_rate: 95, response_time: 2, resolved_reports: 0, total_reports: 0, member_since: "2024-09-01" },
    { user_id: studentId, level: "confirmed", score: 78, verification_level: "silver", reviews_count: 3, average_rating: 4.5, response_rate: 90, response_time: 4, resolved_reports: 0, total_reports: 0, member_since: "2025-09-01" },
  ]);

  // Reviews
  await supabase.from("reviews").insert([
    { id: "rev-1", property_id: "prop-1", reviewed_user_id: landlordId, reviewer_id: studentId,
      rating: 5, criteria: { quality: 5, coexistence: 5, landlordResponse: 5, location: 4, valueForMoney: 5 },
      comment: "Excelente experiência. Maria é muito atenciosa.", recommend: true, verified: true },
  ]);

  // Audit log entries (only if admin exists)
  if (ids.admin) {
    await supabase.from("audit_logs").insert([
      { actor_id: ids.admin, actor_name: "Admin UniRoom", action: "user.verified",
        target_type: "user", target_id: landlordId, target_name: "Maria Santos", severity: "low" },
      { actor_id: ids.admin, actor_name: "Admin UniRoom", action: "property.approved",
        target_type: "property", target_id: "prop-1", target_name: "Apartamento T3 - Marquês de Pombal", severity: "low" },
    ]);
  }

  // Analytics snapshots
  for (const p of properties.filter(x => x.status === "active")) {
    await supabase.from("listing_analytics").insert({
      property_id: p.id, period: "month",
      views: Math.floor(Math.random() * 300) + 100,
      favorites: Math.floor(Math.random() * 30) + 5,
      applications: Math.floor(Math.random() * 10) + 1,
      messages: Math.floor(Math.random() * 20) + 3,
      conversion_rate: 3.5, favorite_rate: 12.4, view_trend: 8.2, application_trend: 5.1,
    });
  }

  console.log("Demo content seeded successfully");
}

app.post("/make-server-08c694dc/active-homes/confirm", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);

    const { applicationId, landlordId, propertyId, roomId, moveInDate } = await c.req.json();
    if (!applicationId || !landlordId || !propertyId) {
      return c.json({ error: "Missing required fields: applicationId, landlordId, propertyId" }, 400);
    }

    const supabase = adminClient();

    // Verify the application belongs to the authenticated user and is accepted
    const { data: app_, error: appErr } = await supabase
      .from("applications")
      .select("id, user_id, status")
      .eq("id", applicationId)
      .single();
    if (appErr || !app_) return c.json({ error: `Application not found: ${appErr?.message}` }, 404);
    if (app_.user_id !== authed.user.id) return c.json({ error: "Forbidden: application belongs to another user" }, 403);
    if (app_.status !== "accepted") return c.json({ error: "Application is not in accepted state" }, 400);

    // Check for existing active home
    const { data: existing } = await supabase
      .from("active_homes")
      .select("id")
      .eq("student_id", authed.user.id)
      .limit(1);
    if (existing && existing.length > 0) {
      return c.json({ error: "already_has_active_home" }, 409);
    }

    // Insert active home using service role (bypasses RLS)
    const { error: insertError } = await supabase.from("active_homes").insert({
      id: crypto.randomUUID(),
      student_id: authed.user.id,
      landlord_id: landlordId,
      property_id: propertyId,
      room_id: roomId || null,
      application_id: applicationId,
      move_in_date: moveInDate || null,
    });
    if (insertError) {
      console.log(`[confirm-stay] insert error: ${insertError.message}`);
      return c.json({ error: `Failed to create active home: ${insertError.message}` }, 500);
    }

    // Mark application as confirmed
    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (updateError) {
      console.log(`[confirm-stay] application update error: ${updateError.message}`);
      // Non-fatal: active home was created, just log it
    }

    // Mark room as occupied (admin client bypasses RLS — student cannot do this directly)
    if (roomId) {
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          status: "occupied",
          occupied_by: authed.user.id,
          move_in_date: moveInDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);
      if (roomError) {
        console.log(`[confirm-stay] room update error: ${roomError.message}`);
        // Non-fatal: log but do not fail the request
      }
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[confirm-stay] error: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Image Storage ────────────────────────────────────────────────────────────

const PROPERTY_BUCKET = "make-08c694dc-property-images";
const ROOM_BUCKET = "make-08c694dc-room-images";

async function ensureImageBuckets() {
  const supabase = adminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const names = new Set(buckets?.map(b => b.name) ?? []);
  for (const name of [PROPERTY_BUCKET, ROOM_BUCKET]) {
    if (!names.has(name)) {
      const { error } = await supabase.storage.createBucket(name, { public: true });
      if (error) console.log(`[storage] failed to create bucket ${name}: ${error.message}`);
      else console.log(`[storage] created bucket ${name}`);
    }
  }
}

app.post("/make-server-08c694dc/images/upload", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const landlordId = formData.get("landlordId") as string | null;
    const propertyId = formData.get("propertyId") as string | null;
    const roomId = formData.get("roomId") as string | null;

    if (!file || !type || !landlordId || !propertyId) {
      return c.json({ error: "Missing required fields: file, type, landlordId, propertyId" }, 400);
    }
    if (!["property", "room"].includes(type)) {
      return c.json({ error: "type must be 'property' or 'room'" }, 400);
    }
    if (authed.user.id !== landlordId) {
      return c.json({ error: "Forbidden: landlordId does not match authenticated user" }, 403);
    }

    const imageId = crypto.randomUUID();
    const bucket = type === "property" ? PROPERTY_BUCKET : ROOM_BUCKET;
    const path = type === "property"
      ? `${landlordId}/${propertyId}/${imageId}.webp`
      : `${landlordId}/${propertyId}/${roomId ?? "misc"}/${imageId}.webp`;

    const buffer = await file.arrayBuffer();
    const supabase = adminClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: "image/webp", upsert: false });

    if (uploadError) {
      console.log(`[images] upload error: ${uploadError.message}`);
      return c.json({ error: `Storage upload failed: ${uploadError.message}` }, 500);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return c.json({ url: urlData.publicUrl });
  } catch (err) {
    console.log(`[images] upload exception: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/make-server-08c694dc/images/cleanup", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);

    const { type, landlordId, propertyId, roomId } = await c.req.json();
    if (!type || !landlordId || !propertyId) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    if (authed.user.id !== landlordId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const supabase = adminClient();
    const bucket = type === "property" ? PROPERTY_BUCKET : ROOM_BUCKET;
    const folder = type === "property"
      ? `${landlordId}/${propertyId}`
      : `${landlordId}/${propertyId}/${roomId}`;

    const { data: files } = await supabase.storage.from(bucket).list(folder);
    if (files && files.length > 0) {
      const paths = files.map(f => `${folder}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[images] cleanup exception: ${err}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Profiles (admin client — bypasses RLS) ──────────────────────────────────

app.get("/make-server-08c694dc/profiles/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);
    // Allow user to fetch their own profile; admins can fetch any
    if (authed.user.id !== id) {
      const db = adminClient();
      const { data: callerProfile } = await db.from("profiles").select("type").eq("id", authed.user.id).maybeSingle();
      if (callerProfile?.type !== "admin") return c.json({ error: "Forbidden" }, 403);
    }
    // Use ensureProfile so first-login users without a row get one created automatically
    const meta = authed.user.user_metadata ?? {};
    const data = await ensureProfile(id, {
      email: authed.user.email ?? meta.email,
      name: meta.full_name ?? meta.name,
      type: meta.type ?? "student",
    });
    return c.json({ data });
  } catch (err) { console.log(`[profiles/:id] exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

// ─── Properties & Rooms (admin client — bypasses RLS, v4) ────────────────────

const PROPERTIES_SELECT =
  "id, landlord_id, title, description, address, city, zone, distance_to_university, coordinates, total_rooms, whole_property_available, whole_property_price, whole_property_utilities, whole_property_minimum_stay, status, verified, admin_suspended, admin_suspension_reason, admin_suspended_at, admin_suspended_by, views, images, amenities, house_rules, created_at, updated_at";

const ROOMS_SELECT =
  "id, property_id, landlord_id, title, room_number, description, price, utilities, room_type, status, available_from, size, area, private_bathroom, desk, wardrobe, balcony, air_conditioning, max_occupants, minimum_stay, images, reserved_by, occupied_by, move_in_date, compatibility_score, views, created_at, updated_at";

type CallerRole = { role: "admin" | "landlord" | "student" | "public"; userId: string | null };

async function getCallerRole(authHeader: string | null): Promise<CallerRole> {
  if (!authHeader) return { role: "public", userId: null };
  const authed = await getAuthedUser(authHeader);
  if (!authed) return { role: "public", userId: null };
  const db = adminClient();
  const { data: profile } = await db.from("profiles").select("type").eq("id", authed.user.id).maybeSingle();
  const type = (profile?.type ?? "student") as CallerRole["role"];
  return { role: type, userId: authed.user.id };
}

// Returns IDs of properties that are publicly visible (active + not suspended).
// Treat admin_suspended = NULL the same as false so new properties without an
// explicit value are still visible (avoids SQL NULL != false exclusion).
async function getPublicPropertyIds(db: ReturnType<typeof adminClient>): Promise<string[]> {
  const { data } = await db
    .from("properties")
    .select("id")
    .eq("status", "active")
    .or("admin_suspended.eq.false,admin_suspended.is.null");
  return (data ?? []).map((p: { id: string }) => p.id);
}

// Is a property publicly visible?
function isPropPublic(p: { status: string; admin_suspended: boolean | null }): boolean {
  return p.status === "active" && !p.admin_suspended;
}

const LANDLORD_PROPERTY_STATUSES = ["active", "draft", "paused"];
const LANDLORD_ROOM_STATUSES = ["available", "draft", "reserved", "occupied", "paused"];

app.get("/make-server-08c694dc/properties", async (c) => {
  try {
    const caller = await getCallerRole(c.req.header("Authorization"));
    const db = adminClient();
    let query = db.from("properties").select(PROPERTIES_SELECT).order("created_at", { ascending: false });
    if (caller.role === "admin") {
      // no filter — sees paused too
    } else if (caller.role === "landlord" && caller.userId) {
      // public (active + not suspended) OR own active/draft (not paused)
      query = query.or(
        `and(status.eq.active,admin_suspended.eq.false),and(landlord_id.eq.${caller.userId},status.in.(${LANDLORD_PROPERTY_STATUSES.join(",")}))`
      );
    } else {
      // student/public: active + not suspended only
      // Treat NULL admin_suspended as false (new properties may lack an explicit value)
      query = query.eq("status", "active").or("admin_suspended.eq.false,admin_suspended.is.null");
    }
    const { data, error } = await query;
    if (error) { console.log(`[properties] list error: ${error.message}`); return c.json({ error: error.message }, 500); }
    return c.json({ data: data ?? [] });
  } catch (err) { console.log(`[properties] list exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

app.get("/make-server-08c694dc/properties/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const caller = await getCallerRole(c.req.header("Authorization"));
    const db = adminClient();
    const { data, error } = await db.from("properties").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Not found" }, 404);
    const visible =
      caller.role === "admin" ||
      isPropPublic(data) ||
      (caller.role === "landlord" && data.landlord_id === caller.userId && LANDLORD_PROPERTY_STATUSES.includes(data.status));
    if (!visible) return c.json({ error: "Not found" }, 404);
    return c.json({ data });
  } catch (err) { console.log(`[properties/:id] exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

app.post("/make-server-08c694dc/properties", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    if (body.landlord_id && body.landlord_id !== authed.user.id) {
      return c.json({ error: "Forbidden: landlord_id mismatch" }, 403);
    }
    const db = adminClient();
    const { error } = await db.from("properties").upsert(body, { onConflict: "id" });
    if (error) { console.log(`[properties] upsert error: ${error.message}`); return c.json({ error: error.message }, 500); }
    return c.json({ success: true });
  } catch (err) { console.log(`[properties] upsert exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

app.get("/make-server-08c694dc/rooms", async (c) => {
  try {
    const caller = await getCallerRole(c.req.header("Authorization"));
    const db = adminClient();

    if (caller.role === "admin") {
      const { data, error } = await db.from("rooms").select(ROOMS_SELECT).order("created_at", { ascending: false });
      if (error) { console.log(`[rooms] list error: ${error.message}`); return c.json({ error: error.message }, 500); }
      return c.json({ data: data ?? [] });
    }

    // Rooms require property-level check: only rooms in active+non-suspended properties are public
    const publicPropIds = await getPublicPropertyIds(db);

    let query = db.from("rooms").select(ROOMS_SELECT).order("created_at", { ascending: false });

    if (caller.role === "landlord" && caller.userId) {
      // Own rooms in allowed statuses (not paused) OR available rooms in public properties
      const ownFilter = `and(landlord_id.eq.${caller.userId},status.in.(${LANDLORD_ROOM_STATUSES.join(",")}))`;
      if (publicPropIds.length > 0) {
        query = query.or(`${ownFilter},and(status.eq.available,property_id.in.(${publicPropIds.join(",")}))`);
      } else {
        query = query.eq("landlord_id", caller.userId).in("status", LANDLORD_ROOM_STATUSES);
      }
    } else {
      // Public: available rooms in public properties only
      if (publicPropIds.length === 0) return c.json({ data: [] });
      query = query.eq("status", "available").in("property_id", publicPropIds);
    }

    const { data, error } = await query;
    if (error) { console.log(`[rooms] list error: ${error.message}`); return c.json({ error: error.message }, 500); }
    return c.json({ data: data ?? [] });
  } catch (err) { console.log(`[rooms] list exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

app.get("/make-server-08c694dc/rooms/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const caller = await getCallerRole(c.req.header("Authorization"));
    const db = adminClient();
    const { data, error } = await db.from("rooms").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Not found" }, 404);

    if (caller.role === "admin") return c.json({ data });
    if (caller.role === "landlord" && data.landlord_id === caller.userId && LANDLORD_ROOM_STATUSES.includes(data.status)) return c.json({ data });

    // Public/student (or landlord viewing another landlord's room): available + property must be public
    if (data.status !== "available") return c.json({ error: "Not found" }, 404);
    const { data: prop } = await db.from("properties").select("status, admin_suspended").eq("id", data.property_id).maybeSingle();
    if (!prop || !isPropPublic(prop)) return c.json({ error: "Not found" }, 404);
    return c.json({ data });
  } catch (err) { console.log(`[rooms/:id] exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

app.post("/make-server-08c694dc/rooms", async (c) => {
  try {
    const authed = await getAuthedUser(c.req.header("Authorization"));
    if (!authed) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    if (body.landlord_id && body.landlord_id !== authed.user.id) {
      return c.json({ error: "Forbidden: landlord_id mismatch" }, 403);
    }
    if (body.property_id) {
      const db = adminClient();
      const { data: prop } = await db.from("properties").select("landlord_id").eq("id", body.property_id).maybeSingle();
      if (!prop || prop.landlord_id !== authed.user.id) {
        return c.json({ error: "Forbidden: property_id does not belong to this landlord" }, 403);
      }
    }
    const db = adminClient();
    const { error } = await db.from("rooms").upsert(body, { onConflict: "id" });
    if (error) { console.log(`[rooms] upsert error: ${error.message}`); return c.json({ error: error.message }, 500); }
    return c.json({ success: true });
  } catch (err) { console.log(`[rooms] upsert exception: ${err}`); return c.json({ error: "Internal server error" }, 500); }
});

// ─── Startup ──────────────────────────────────────────────────────────────────

(async () => {
  try {
    await ensureImageBuckets();
  } catch (e) {
    console.log(`Bucket setup error: ${e}`);
  }
  try {
    const ids = await seedDemoUsers();
    if (ids) await seedDemoContent(ids);
  } catch (e) {
    console.log(`Seed pipeline error: ${e}`);
  }
})();

Deno.serve(app.fetch);
