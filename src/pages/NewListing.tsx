import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Home, Check, Save, Eye } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
import { Badge } from '../components/Badge';
import { ListingFormData, defaultFormData } from '../types/listing';
import { toast } from 'sonner';

export function NewListing() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(defaultFormData);

  const steps = [
    { number: 1, title: 'Informação básica', description: 'Título, descrição e localização' },
    { number: 2, title: 'Características', description: 'Tipo de quarto e capacidade' },
    { number: 3, title: 'Fotografias', description: 'Imagens do alojamento' },
    { number: 4, title: 'Preço', description: 'Valor mensal e despesas' },
    { number: 5, title: 'Disponibilidade', description: 'Datas e permanência mínima' },
    { number: 6, title: 'Regras da casa', description: 'Políticas e regras' },
    { number: 7, title: 'Perfil ideal', description: 'Preferências de ocupante' },
    { number: 8, title: 'Revisão final', description: 'Verificar e publicar' },
  ];

  const cities = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Viseu', 'Aveiro', 'Faro', 'Évora'];

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData(previous => ({ ...previous, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Rascunho guardado com sucesso!');
  };

  const handlePublish = () => {
    toast.success('Alojamento publicado com sucesso!', {
      description: 'O teu anúncio está agora visível para estudantes.',
    });

    setTimeout(() => {
      navigate('/landlord/listings');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/landlord/listings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar aos alojamentos</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Publicar novo alojamento
              </h1>
              <p className="text-muted-foreground">
                Passo {currentStep} de 8: {steps[currentStep - 1].title}
              </p>
            </div>

            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Guardar rascunho
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Progresso</h3>

              <div className="space-y-3">
                {steps.map(step => (
                  <button
                    key={step.number}
                    onClick={() => setCurrentStep(step.number)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentStep === step.number
                        ? 'bg-primary text-white'
                        : currentStep > step.number
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          currentStep === step.number
                            ? 'bg-white text-primary'
                            : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-semibold">{step.number}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{step.title}</p>
                        <p className="text-xs opacity-75 truncate">{step.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Conclusão</span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round((currentStep / 8) * 100)}%
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(currentStep / 8) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Informação básica</h2>
                    <p className="text-muted-foreground">Dá-nos os detalhes principais do teu alojamento.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Título do anúncio
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(event) => updateFormData({ title: event.target.value })}
                      placeholder="Ex: Quarto confortável perto da universidade"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/100 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(event) => updateFormData({ description: event.target.value })}
                      placeholder="Descreve o teu alojamento em detalhe..."
                      className="w-full px-4 py-3 border border-border bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows={6}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/1000 caracteres</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Cidade
                      </label>
                      <select
                        value={formData.city}
                        onChange={(event) => updateFormData({ city: event.target.value })}
                        className="w-full px-4 py-3 border border-border bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Seleciona...</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Zona
                      </label>
                      <Input
                        value={formData.zone}
                        onChange={(event) => updateFormData({ zone: event.target.value })}
                        placeholder="Ex: Centro, Baixa, Avenidas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Morada completa
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(event) => updateFormData({ address: event.target.value })}
                      placeholder="Rua, número, andar"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Características</h2>
                    <p className="text-muted-foreground">Especifica o tipo de alojamento e capacidade.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Tipo de alojamento
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: 'private', label: 'Quarto privado' },
                        { value: 'shared', label: 'Quarto partilhado' },
                        { value: 'studio', label: 'Estúdio' },
                        { value: 'apartment', label: 'Apartamento' },
                      ].map(type => (
                        <button
                          key={type.value}
                          onClick={() => updateFormData({ roomType: type.value as ListingFormData['roomType'] })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.roomType === type.value
                              ? 'border-primary bg-blue-50'
                              : 'border-border hover:border-primary/60'
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground">{type.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Número máximo de ocupantes
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.maxOccupants}
                        onChange={(event) => updateFormData({ maxOccupants: parseInt(event.target.value) || 1 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Ocupantes atuais
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={formData.maxOccupants}
                        value={formData.currentOccupants}
                        onChange={(event) => updateFormData({ currentOccupants: parseInt(event.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Comodidades
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries({
                        furnished: 'Mobilado',
                        wifi: 'Wi-Fi',
                        kitchen: 'Cozinha',
                        washingMachine: 'Máquina de lavar',
                        balcony: 'Varanda',
                        parking: 'Estacionamento',
                        airConditioning: 'Ar condicionado',
                        heating: 'Aquecimento',
                        elevator: 'Elevador',
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                          <Checkbox
                            checked={formData.amenities[key as keyof typeof formData.amenities]}
                            onChange={(event) =>
                              updateFormData({
                                amenities: { ...formData.amenities, [key]: event.target.checked },
                              })
                            }
                          />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Fotografias</h2>
                    <p className="text-muted-foreground">Adiciona fotos do teu alojamento.</p>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                    <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-3">
                      Clica para fazer upload ou arrasta as imagens.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG ou PNG, máximo 5MB por imagem.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-foreground">
                      Alojamentos com fotos de qualidade recebem mais visualizações. Usa boa luz natural e mostra diferentes ângulos do espaço.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Preço</h2>
                    <p className="text-muted-foreground">Define o valor mensal do alojamento.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Valor mensal (€)
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                      <Input
                        type="number"
                        min={0}
                        value={formData.price || ''}
                        onChange={(event) => updateFormData({ price: parseFloat(event.target.value) || 0 })}
                        className="pl-8"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-4">
                      <Checkbox
                        checked={formData.utilitiesIncluded}
                        onChange={(event) => updateFormData({ utilitiesIncluded: event.target.checked })}
                      />
                      <span className="text-sm font-medium text-foreground">
                        Despesas incluídas no preço
                      </span>
                    </label>

                    {!formData.utilitiesIncluded && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          Valor mensal de despesas (€)
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                          <Input
                            type="number"
                            min={0}
                            value={formData.utilities || ''}
                            onChange={(event) => updateFormData({ utilities: parseFloat(event.target.value) || undefined })}
                            className="pl-8"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Valor total mensal:</span>
                      <span className="text-2xl font-bold text-primary">
                        €{formData.price + (formData.utilitiesIncluded ? 0 : (formData.utilities || 0))}
                      </span>
                    </div>

                    {!formData.utilitiesIncluded && formData.utilities && (
                      <p className="text-xs text-muted-foreground">
                        €{formData.price} renda + €{formData.utilities} despesas
                      </p>
                    )}
                  </Card>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Disponibilidade</h2>
                    <p className="text-muted-foreground">Quando está disponível e por quanto tempo.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Disponível a partir de
                    </label>
                    <Input
                      type="date"
                      value={formData.availableFrom}
                      onChange={(event) => updateFormData({ availableFrom: event.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Permanência mínima em meses
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={formData.minimumStay}
                      onChange={(event) => updateFormData({ minimumStay: parseInt(event.target.value) || 1 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Duração mínima de arrendamento recomendada: 6 meses.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Regras da casa</h2>
                    <p className="text-muted-foreground">Define as políticas do alojamento.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border border-border rounded-lg">
                      <Checkbox
                        checked={formData.smokingAllowed}
                        onChange={(event) => updateFormData({ smokingAllowed: event.target.checked })}
                      />

                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">Permitir fumar</span>

                        {formData.smokingAllowed && (
                          <Input
                            value={formData.smokingLocation || ''}
                            onChange={(event) => updateFormData({ smokingLocation: event.target.value })}
                            placeholder="Ex: Apenas na varanda"
                            className="mt-2"
                          />
                        )}
                      </div>
                    </label>

                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <Checkbox
                        checked={formData.petsAllowed}
                        onChange={(event) => updateFormData({ petsAllowed: event.target.checked })}
                      />
                      <span className="text-sm font-medium text-foreground">Permitir animais de estimação</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Política de visitas
                    </label>
                    <Input
                      value={formData.guestsPolicy}
                      onChange={(event) => updateFormData({ guestsPolicy: event.target.value })}
                      placeholder="Ex: Permitido com aviso prévio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Horário de silêncio
                    </label>
                    <Input
                      value={formData.quietHours || ''}
                      onChange={(event) => updateFormData({ quietHours: event.target.value })}
                      placeholder="Ex: Silêncio após as 23h"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Horário de limpeza
                    </label>
                    <Input
                      value={formData.cleaningSchedule || ''}
                      onChange={(event) => updateFormData({ cleaningSchedule: event.target.value })}
                      placeholder="Ex: Rotação semanal entre moradores"
                    />
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Perfil ideal do ocupante</h2>
                    <p className="text-muted-foreground">Define as tuas preferências opcionais.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Género preferido
                    </label>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'any', label: 'Indiferente' },
                        { value: 'male', label: 'Masculino' },
                        { value: 'female', label: 'Feminino' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateFormData({
                            idealOccupant: {
                              ...formData.idealOccupant,
                              preferredGender: option.value as ListingFormData['idealOccupant']['preferredGender'],
                            },
                          })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            formData.idealOccupant.preferredGender === option.value
                              ? 'border-primary bg-blue-50'
                              : 'border-border hover:border-primary/60'
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <Checkbox
                        checked={formData.idealOccupant.studentOnly}
                        onChange={(event) => updateFormData({
                          idealOccupant: { ...formData.idealOccupant, studentOnly: event.target.checked },
                        })}
                      />
                      <span className="text-sm font-medium text-foreground">Apenas estudantes</span>
                    </label>

                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <Checkbox
                        checked={formData.idealOccupant.smoking}
                        onChange={(event) => updateFormData({
                          idealOccupant: { ...formData.idealOccupant, smoking: event.target.checked },
                        })}
                      />
                      <span className="text-sm font-medium text-foreground">Aceita fumadores</span>
                    </label>

                    <label className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <Checkbox
                        checked={formData.idealOccupant.pets}
                        onChange={(event) => updateFormData({
                          idealOccupant: { ...formData.idealOccupant, pets: event.target.checked },
                        })}
                      />
                      <span className="text-sm font-medium text-foreground">Aceita com animais</span>
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 8 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Revisão final</h2>
                    <p className="text-muted-foreground">Verifica todos os detalhes antes de publicar.</p>
                  </div>

                  <Card className="p-6 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-4">Resumo do anúncio</h3>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Título</p>
                        <p className="font-medium text-foreground">{formData.title || 'Não definido'}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Localização</p>
                        <p className="font-medium text-foreground">
                          {formData.zone}, {formData.city || 'Não definida'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Tipo</p>
                        <Badge>
                          {formData.roomType === 'private' && 'Quarto privado'}
                          {formData.roomType === 'shared' && 'Quarto partilhado'}
                          {formData.roomType === 'studio' && 'Estúdio'}
                          {formData.roomType === 'apartment' && 'Apartamento'}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Preço</p>
                        <p className="text-2xl font-bold text-primary">
                          €{formData.price + (formData.utilitiesIncluded ? 0 : (formData.utilities || 0))}/mês
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1">Disponível a partir de</p>
                        <p className="font-medium text-foreground">
                          {formData.availableFrom
                            ? new Date(formData.availableFrom).toLocaleDateString('pt-PT')
                            : 'Não definido'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-4">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-foreground">
                        <p className="font-medium mb-1">Pronto para publicar!</p>
                        <p>
                          O teu anúncio será visível para estudantes assim que clicares em "Publicar anúncio".
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
                <div>
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {currentStep < 8 ? (
                    <Button onClick={handleNext}>
                      Continuar
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleSaveDraft}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar rascunho
                      </Button>

                      <Button onClick={handlePublish}>
                        <Eye className="w-4 h-4 mr-2" />
                        Publicar anúncio
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}