import { ReactNode } from 'react';
import { Card } from '../../components/Card';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: 'primary' | 'secondary' | 'accent';
}

export function FeatureCard({ icon, title, description, color = 'primary' }: FeatureCardProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent-foreground',
  };

  return (
    <Card hover className="p-8 text-center group">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colorStyles[color]} mb-6 group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
