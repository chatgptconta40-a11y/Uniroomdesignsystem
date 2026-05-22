import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { FileText, User, CheckCircle, XCircle, MessageCircle, Mail, GraduationCap, Calendar, Shield, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApplicationsForLandlord, updateApplicationStatus, getApplicationStats } from '../data/mockLandlordApplications';
import { getVerificationBadge, getTrustBadge } from '../data/mockTrust';
import { ApplicationStatus } from '../types/accommodation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { toast } from 'sonner';

export function LandlordApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const listingFilter = searchParams.get('listing') || undefined;

  const allApplications = getApplicationsForLandlord(user?.id || '', listingFilter);
  const stats = getApplicationStats(user?.id || '');

  const filteredApplications = filter === 'all'
    ? allApplications
    : allApplications.filter(app => app.status === filter);

  const handleAccept = (applicationId: string, applicantName: string) => {
    if (updateApplicationStatus(applicationId, 'accepted', user?.id)) {
      toast.success(`Candidatura de ${applicantName} aceite!`, {
        description: 'O candidato foi notificado e a casa foi ativada.',
      });
    }
  };

  const handleReject = (applicationId: string, applicantName: string) => {
    if (window.confirm(`Tens a certeza que queres rejeitar a candidatura de ${applicantName}?`)) {
      if (updateApplicationStatus(applicationId, 'rejected', user?.id)) {
        toast.success('Candidatura rejeitada');
      }
    }
  };

  const handleMessage = () => {
    navigate('/messages');
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-muted-foreground bg-muted';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Candidaturas</h1>
          </div>
          <p className="text-muted-foreground">
            Gere as candidaturas aos teus alojamentos
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card
            className={`p-4 cursor-pointer transition-all ${
              filter === 'all' ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('all')}
          >
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              filter === 'pending' ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('pending')}
          >
            <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              filter === 'under_review' ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('under_review')}
          >
            <p className="text-sm text-muted-foreground mb-1">Em Análise</p>
            <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              filter === 'accepted' ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('accepted')}
          >
            <p className="text-sm text-muted-foreground mb-1">Aceites</p>
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              filter === 'rejected' ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFilter('rejected')}
          >
            <p className="text-sm text-muted-foreground mb-1">Rejeitadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </Card>
        </div>

        {filteredApplications.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Sem candidaturas
            </h2>
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'Ainda não recebeste candidaturas.'
                : `Não tens candidaturas ${filter}.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const verificationBadge = getVerificationBadge(application.verificationLevel);
              const trustBadge = getTrustBadge(application.trustLevel);

              return (
                <Card key={application.id} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                            {application.applicantName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {application.applicantName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge className={trustBadge.bgColor + ' ' + trustBadge.color}>
                                <Shield className="w-3 h-3 mr-1" />
                                {trustBadge.label}
                              </Badge>
                              {application.verificationLevel !== 'none' && (
                                <Badge className="bg-card border-2 border-yellow-400">
                                  {verificationBadge.icon} {verificationBadge.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                {application.applicantCourse} - {application.applicantYear}º ano
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {application.applicantEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-4 rounded-lg ${getCompatibilityColor(application.compatibilityScore)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Compatibilidade</span>
                            <Star className="w-5 h-5" />
                          </div>
                          <p className="text-3xl font-bold mt-1">{application.compatibilityScore}%</p>
                          <p className="text-xs mt-1 opacity-75">
                            {application.compatibilityScore >= 80 ? 'Excelente match' :
                             application.compatibilityScore >= 60 ? 'Bom match' : 'Match moderado'}
                          </p>
                        </div>

                        <div className={`p-4 rounded-lg ${getTrustScoreColor(application.trustScore)}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Trust Score</span>
                            <Shield className="w-5 h-5" />
                          </div>
                          <p className="text-3xl font-bold mt-1">{application.trustScore}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {application.trustScore >= 75 ? 'Muito confiável' :
                             application.trustScore >= 50 ? 'Confiável' : 'Perfil recente'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Alojamento</p>
                        <p className="font-medium text-foreground">{application.listingTitle}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">€{application.listingPrice}/mês</span>
                          {application.moveInDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Entrada: {new Date(application.moveInDate).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>

                      {application.message && (
                        <div className="mb-4 p-4 bg-card border border-border rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-3">Mensagem:</p>
                          <p className="text-sm text-foreground italic">"{application.message}"</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Candidatura: {new Date(application.createdAt).toLocaleDateString('pt-PT')}</span>
                        {application.reviewedAt && (
                          <>
                            <span>•</span>
                            <span>Resposta: {new Date(application.reviewedAt).toLocaleDateString('pt-PT')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-48 flex lg:flex-col gap-2">
                      {application.status === 'pending' || application.status === 'under_review' ? (
                        <>
                          <Button
                            onClick={() => handleAccept(application.id, application.applicantName)}
                            className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button
                            onClick={() => handleReject(application.id, application.applicantName)}
                            variant="outline"
                            className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                          <Button
                            onClick={handleMessage}
                            variant="outline"
                            className="flex-1 lg:flex-none"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Conversar
                          </Button>
                        </>
                      ) : application.status === 'accepted' ? (
                        <>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-green-900">Aceite</p>
                          </div>
                          <Button onClick={handleMessage} variant="outline" className="flex-1 lg:flex-none">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Mensagem
                          </Button>
                        </>
                      ) : (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-red-900">Rejeitada</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}