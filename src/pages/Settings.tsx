import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { User, Shield, Trash2, Download, Edit, Ruler, Plus, AlertTriangle, Globe, Mail, MessageCircle, Star, ChevronRight, LogOut, ScanFace, Bell, Languages } from 'lucide-react'
import { calculateIMC, formatWeight, formatHeight, getMedicationInfo } from '@/lib/health-utils'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import { PwaInstallInstructions } from '@/components/pwa-install-prompt'
import { useTranslation } from '@/contexts/LanguageContext'
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n'
import type { BodyMeasurement, Goal, ActivityLevel, MedicationType, DietaryPreference, Gender, SleepQuality, FastingExperience } from '@/types'

export function Settings() {
  const {
    user, setUser, logout,
    isBiometricAvailable, isBiometricEnabled, enableBiometric, disableBiometric,
    privacySettings, updatePrivacySettings,
    bodyMeasurements, addBodyMeasurement,
    addWeightEntry,
  } = useApp()
  const { t, language, setLanguage } = useTranslation()
  const navigate = useNavigate()

  const GOAL_LABELS = t.settings.goals
  const ACTIVITY_LABELS = t.settings.activityLevels
  const MEDICATION_LABELS = t.settings.medications
  const DIETARY_LABELS = t.settings.dietary as Record<DietaryPreference, string>
  const GENDER_LABELS = t.settings.genders as Record<Gender, string>
  const SLEEP_QUALITY_LABELS = t.settings.sleepQualities as Record<SleepQuality, string>
  const FASTING_EXPERIENCE_LABELS = t.settings.fastingExperiences as Record<FastingExperience, string>
  const DIETARY_OPTIONS: { value: DietaryPreference; label: string }[] = [
    { value: 'vegetariano', label: DIETARY_LABELS.vegetariano },
    { value: 'vegano', label: DIETARY_LABELS.vegano },
    { value: 'sem_lactose', label: DIETARY_LABELS.sem_lactose },
    { value: 'sem_gluten', label: DIETARY_LABELS.sem_gluten },
    { value: 'low_carb', label: DIETARY_LABELS.low_carb },
    { value: 'diabetes', label: DIETARY_LABELS.diabetes },
  ]

  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddMeasurement, setShowAddMeasurement] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [enablingBiometric, setEnablingBiometric] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const [editedProfile, setEditedProfile] = useState(user)

  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurement>>({
    date: new Date(),
    weight: user?.currentWeight || 0,
    waist: 0,
    hips: 0
  })

  if (!user) return null

  const hasProfileData = !!(user.height && user.currentWeight)
  const imc = hasProfileData ? calculateIMC(user.currentWeight, user.height) : null
  const medicationInfo = getMedicationInfo(user.medication)

  const activeDietaryPrefs = (user.dietaryPreferences || []).filter(p => p !== 'nenhuma')

  const measurements = bodyMeasurements

  const handleExportData = () => {
    const data = {
      user,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bemai-dados-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast.success(t.settings.privacy.exported, {
      description: t.settings.privacy.exportedDesc
    })
  }

  const handleDeleteData = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteData = () => {
    localStorage.clear()
    setUser(null)
    window.location.reload()
  }

  const handleSaveProfile = () => {
    if (!editedProfile || !user) return
    const weightChanged = editedProfile.currentWeight !== user.currentWeight && editedProfile.currentWeight > 0
    setUser(editedProfile)
    if (weightChanged) {
      addWeightEntry({
        id: crypto.randomUUID(),
        date: new Date(),
        weight: editedProfile.currentWeight,
        notes: 'Atualizado pelo perfil',
      })
    }
    setShowEditProfile(false)
    toast.success(t.settings.profile.profileUpdated, {
      description: t.settings.profile.profileUpdatedDesc
    })
  }

  const handleAddMeasurement = () => {
    if (!newMeasurement.weight || !newMeasurement.waist || !newMeasurement.hips) {
      toast.error(t.settings.measurements.required, {
        description: t.settings.measurements.requiredDesc
      })
      return
    }

    const measurement: BodyMeasurement = {
      id: crypto.randomUUID(),
      date: new Date(),
      weight: newMeasurement.weight!,
      waist: newMeasurement.waist!,
      hips: newMeasurement.hips!,
      neck: newMeasurement.neck,
      chest: newMeasurement.chest,
      thigh: newMeasurement.thigh,
      arm: newMeasurement.arm,
      calf: newMeasurement.calf,
      bodyFat: newMeasurement.bodyFat,
      notes: newMeasurement.notes
    }

    // Salva medida via AppContext (sincroniza com Supabase + Dashboard + Progress)
    addBodyMeasurement(measurement)

    // Se peso mudou, registra no histórico e recalcula metas no perfil
    if (user && measurement.weight && measurement.weight !== user.currentWeight) {
      addWeightEntry({
        id: crypto.randomUUID(),
        date: new Date(),
        weight: measurement.weight,
        notes: 'Registrado em medidas corporais',
      })
    }

    setShowAddMeasurement(false)
    setNewMeasurement({
      date: new Date(),
      weight: measurement.weight,
      waist: 0,
      hips: 0
    })

    toast.success(t.settings.measurements.saved, {
      description: t.settings.measurements.savedDesc
    })
  }

  const toggleDietaryPref = (pref: DietaryPreference) => {
    setEditedProfile(prev => {
      if (!prev) return prev
      const prefs = prev.dietaryPreferences || []
      if (prefs.includes(pref)) {
        const updated = prefs.filter(p => p !== pref)
        return { ...prev, dietaryPreferences: updated.length === 0 ? ['nenhuma'] : updated }
      } else {
        return { ...prev, dietaryPreferences: [...prefs.filter(p => p !== 'nenhuma'), pref] }
      }
    })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/icons_app/construtor.png" alt="Mascote" className="w-24 h-24 mx-auto object-contain drop-shadow-md" />
          <h1 className="text-3xl font-bold">{t.settings.title}</h1>
          <p className="text-muted-foreground">{t.settings.subtitle}</p>
        </div>

        {/* Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {t.settings.profile.title}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedProfile(user)
                  setShowEditProfile(true)
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                {t.common.edit}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.name}</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.age}</span>
                <span className="font-medium">{user.age} {t.common.years}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.height}</span>
                <span className="font-medium">{formatHeight(user.height)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.currentWeight}</span>
                <span className="font-medium">{formatWeight(user.currentWeight)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.targetWeight}</span>
                <span className="font-medium">{formatWeight(user.targetWeight)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.imc}</span>
                <span className="font-medium text-sm">{imc ? `${imc.value} - ${imc.description}` : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.goal}</span>
                <span className="font-medium">{GOAL_LABELS[user.goal]}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.settings.profile.activity}</span>
                <span className="font-medium">{ACTIVITY_LABELS[user.activityLevel]}</span>
              </div>

              {activeDietaryPrefs.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">{t.settings.profile.dietaryPrefs}</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {activeDietaryPrefs.map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {DIETARY_LABELS[p]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {user.bodyFatPercentage != null && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.settings.profile.bodyFat}</span>
                    <span className="font-medium">{user.bodyFatPercentage}%</span>
                  </div>
                </>
              )}

              {user.country && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.settings.profile.country}</span>
                    <span className="font-medium">{user.country}</span>
                  </div>
                </>
              )}

              {user.language && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.settings.profile.language}</span>
                    <span className="font-medium">
                      {SUPPORTED_LANGUAGES.find(l => l.value === user.language)?.label ?? user.language}
                    </span>
                  </div>
                </>
              )}

              {user.medication !== 'nenhum' && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.settings.profile.medication}</span>
                    <span className="font-medium">{medicationInfo.name}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medidas Corporais */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                {t.settings.measurements.title}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddMeasurement(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t.common.add}
              </Button>
            </div>
            <CardDescription>
              {t.settings.measurements.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {measurements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ruler className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.settings.measurements.empty}</p>
                <p className="text-xs mt-1">{t.settings.measurements.emptyHint}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {measurements.slice(0, 5).map((m) => (
                  <Card key={m.id} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {m.date.toLocaleDateString('pt-BR')}
                          </span>
                          <Badge variant="outline">
                            {formatWeight(m.weight ?? 0)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          {m.waist && <div>{t.settings.measurements.waist}: {m.waist}cm</div>}
                          {m.hips && <div>{t.settings.measurements.hips}: {m.hips}cm</div>}
                          {m.bodyFat && <div>{t.settings.measurements.fat}: {m.bodyFat}%</div>}
                        </div>
                        {m.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            "{m.notes}"
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {measurements.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground">
                    {t.settings.measurements.showingLast} {measurements.length}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.appearance.title}</CardTitle>
            <CardDescription>{t.settings.appearance.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.settings.appearance.theme}</div>
                <div className="text-sm text-muted-foreground">{t.settings.appearance.themeDesc}</div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Instalar o app na tela inicial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Instalar o app
            </CardTitle>
            <CardDescription>
              Adicione o Bem.AI à tela inicial do seu celular para acesso rápido, como um aplicativo (Android e iPhone).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setShowInstallGuide(true)}>
              <Download className="w-4 h-4 mr-2" />
              Como instalar o app
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
          <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Como instalar o Bem.AI</DialogTitle>
              <DialogDescription>
                Tenha acesso rápido direto da tela inicial, igual a um app.
              </DialogDescription>
            </DialogHeader>
            <PwaInstallInstructions />
          </DialogContent>
        </Dialog>

        {/* Idioma do Aplicativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              {t.settings.language.title}
            </CardTitle>
            <CardDescription>{t.settings.language.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t.settings.language.label}</Label>
              <Select
                value={language}
                onValueChange={(value) => {
                  const lang = value as Language
                  setLanguage(lang)
                  // Also update user profile language
                  if (user) {
                    setUser({ ...user, language: lang })
                  }
                  const label = SUPPORTED_LANGUAGES.find(l => l.value === lang)?.label ?? lang
                  toast.success(t.settings.language.changed, {
                    description: `${t.settings.language.changedDesc} ${label}`,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.flag} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Acesso Rápido — Biometria */}
        {isBiometricAvailable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-primary" />
                {t.settings.biometric.title}
              </CardTitle>
              <CardDescription>
                {t.settings.biometric.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.settings.biometric.deviceBiometric}</p>
                  <p className="text-xs text-muted-foreground">
                    {isBiometricEnabled ? t.settings.biometric.enabled : t.settings.biometric.disabled}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBiometricEnabled}
                  onClick={async () => {
                    if (isBiometricEnabled) {
                      disableBiometric()
                      toast.success(t.settings.biometric.deactivated)
                    } else {
                      setEnablingBiometric(true)
                      const { error } = await enableBiometric()
                      setEnablingBiometric(false)
                      if (error) toast.error(error)
                      else toast.success(t.settings.biometric.activated)
                    }
                  }}
                  disabled={enablingBiometric}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 ${isBiometricEnabled ? 'bg-primary' : 'bg-input'}`}
                >
                  <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform mt-0.5 ${isBiometricEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {enablingBiometric && (
                <p className="text-xs text-muted-foreground">{t.settings.biometric.waiting}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Privacidade e Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t.settings.privacy.title}
            </CardTitle>
            <CardDescription>{t.settings.privacy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pt-1">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                {t.settings.privacy.export}
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDeleteData}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.settings.privacy.deleteAll}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sobre LGPD */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.lgpd.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t.settings.lgpd.description}
            </p>
            <p>
              <strong>{t.settings.lgpd.rights}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t.settings.lgpd.right1}</li>
              <li>{t.settings.lgpd.right2}</li>
              <li>{t.settings.lgpd.right3}</li>
              <li>{t.settings.lgpd.right4}</li>
              <li>{t.settings.lgpd.right5}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Notificacoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t.settings.notifications.title}
            </CardTitle>
            <CardDescription>{t.settings.notifications.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.notifications.reminders}</p>
                <p className="text-xs text-muted-foreground">{t.settings.notifications.remindersDesc}</p>
              </div>
              <button
                onClick={() => {
                  const next = !privacySettings.notifications
                  updatePrivacySettings({ notifications: next })
                  toast.success(next ? t.settings.notifications.activated : t.settings.notifications.deactivated)
                }}
                className={`w-11 h-6 rounded-full relative transition-colors ${privacySettings.notifications ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ left: privacySettings.notifications ? '22px' : '2px' }}
                />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t.settings.notifications.remindersInfo}
            </p>
          </CardContent>
        </Card>

        {/* Seu Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              {t.settings.plan.title}
            </CardTitle>
            <CardDescription>{t.settings.plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between bg-primary/10 rounded-xl px-4 py-3">
              <div>
                <p className="font-semibold text-primary">{t.settings.plan.premium}</p>
                <p className="text-xs text-muted-foreground">{t.settings.plan.premiumDesc}</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">{t.settings.plan.active}</Badge>
            </div>
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border hover:bg-muted/50 transition-colors text-left cursor-pointer"
              onClick={() => navigate('/planos')}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t.settings.plan.changePlan}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Suporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {t.settings.support.title}
            </CardTitle>
            <CardDescription>{t.settings.support.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
              onClick={() => window.open('mailto:contato@vivabemapp.com?subject=Suporte - Bem.AI', '_blank')}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.settings.support.contact}</p>
                  <p className="text-xs text-muted-foreground">contato@vivabemapp.com</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.settings.logout}
            </Button>
          </CardContent>
        </Card>

        {/* Versão */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t.settings.version}</p>
          <p className="mt-1">{t.settings.madeWith}</p>
        </div>
      </div>

      {/* Dialog de Edição de Perfil */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.settings.profile.reconfigure}</DialogTitle>
            <DialogDescription>
              {t.settings.profile.reconfigureDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seção: Dados Pessoais */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.settings.profile.personalData}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t.settings.profile.name}</Label>
                <Input
                  id="edit-name"
                  value={editedProfile?.name || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">{t.settings.profile.age}</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editedProfile?.age || 0}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, age: parseInt(e.target.value) } : prev)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gender">{t.settings.profile.gender}</Label>
              <Select
                value={editedProfile?.gender}
                onValueChange={(value: Gender) => setEditedProfile(prev => prev ? { ...prev, gender: value } : prev)}
              >
                <SelectTrigger id="edit-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seção: Medidas */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.measuresGoals}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-height">{t.settings.profile.heightCm}</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={editedProfile?.height || 0}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, height: parseInt(e.target.value) } : prev)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">{t.settings.profile.weightKg}</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={editedProfile?.currentWeight || 0}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, currentWeight: parseFloat(e.target.value) } : prev)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-target-weight">{t.settings.profile.targetWeightKg}</Label>
              <Input
                id="edit-target-weight"
                type="number"
                step="0.1"
                value={editedProfile?.targetWeight || 0}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, targetWeight: parseFloat(e.target.value) } : prev)}
              />
            </div>

            {/* Seção: Estilo de Vida */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.lifestyle}</p>

            <div className="space-y-2">
              <Label htmlFor="edit-goal">{t.settings.profile.goal}</Label>
              <Select
                value={editedProfile?.goal}
                onValueChange={(value: Goal) => setEditedProfile(prev => prev ? { ...prev, goal: value } : prev)}
              >
                <SelectTrigger id="edit-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perder_peso">{GOAL_LABELS.perder_peso}</SelectItem>
                  <SelectItem value="ganhar_massa">{GOAL_LABELS.ganhar_massa}</SelectItem>
                  <SelectItem value="manter_peso">{GOAL_LABELS.manter_peso}</SelectItem>
                  <SelectItem value="saude_geral">{GOAL_LABELS.saude_geral}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-activity">{t.settings.profile.activityLevel}</Label>
              <Select
                value={editedProfile?.activityLevel}
                onValueChange={(value: ActivityLevel) => setEditedProfile(prev => prev ? { ...prev, activityLevel: value } : prev)}
              >
                <SelectTrigger id="edit-activity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seção: Alimentação */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.foodSection}</p>

            {/* Preferências Alimentares */}
            <div className="space-y-2">
              <Label>{t.settings.profile.dietaryPrefs}</Label>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_OPTIONS.map(opt => {
                  const checked = (editedProfile?.dietaryPreferences || []).includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={checked}
                        onChange={() => toggleDietaryPref(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Seção: Localização */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.locationLanguage}</p>

            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="edit-country">
                <Globe className="w-3.5 h-3.5 inline mr-1" />
                {t.settings.profile.countryLabel}
              </Label>
              <Input
                id="edit-country"
                placeholder={t.settings.profile.countryPlaceholder}
                value={editedProfile?.country || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, country: e.target.value } : prev)}
              />
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="edit-language">{t.settings.profile.language}</Label>
              <Select
                value={editedProfile?.language || ''}
                onValueChange={(value) => setEditedProfile(prev => prev ? { ...prev, language: value } : prev)}
              >
                <SelectTrigger id="edit-language">
                  <SelectValue placeholder={t.settings.profile.selectLanguage} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.flag} {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seção: Medicação */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.medicationSection}</p>

            <div className="space-y-2">
              <Label htmlFor="edit-medication">{t.settings.profile.medicationInUse}</Label>
              <Select
                value={editedProfile?.medication}
                onValueChange={(value: MedicationType) => setEditedProfile(prev => prev ? { ...prev, medication: value } : prev)}
              >
                <SelectTrigger id="edit-medication">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDICATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seção: Sono */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.sleepSection}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sleep-hours">{t.settings.profile.avgSleepHours}</Label>
                <Input
                  id="edit-sleep-hours"
                  type="number"
                  step="0.5"
                  min={1}
                  max={24}
                  value={editedProfile?.averageSleepHours || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, averageSleepHours: parseFloat(e.target.value) } : prev)}
                  placeholder="Ex: 7.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sleep-quality">{t.settings.profile.sleepQuality}</Label>
                <Select
                  value={editedProfile?.sleepQuality}
                  onValueChange={(value: SleepQuality) => setEditedProfile(prev => prev ? { ...prev, sleepQuality: value } : prev)}
                >
                  <SelectTrigger id="edit-sleep-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SLEEP_QUALITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção: Jejum */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.fastingSection}</p>

            <div className="space-y-2">
              <Label htmlFor="edit-fasting-exp">{t.settings.profile.fastingExperience}</Label>
              <Select
                value={editedProfile?.fastingExperience}
                onValueChange={(value: FastingExperience) => setEditedProfile(prev => prev ? { ...prev, fastingExperience: value } : prev)}
              >
                <SelectTrigger id="edit-fasting-exp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FASTING_EXPERIENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm">{t.settings.profile.interestedInFasting}</span>
              <button
                type="button"
                role="switch"
                aria-checked={editedProfile?.interestedInFasting}
                onClick={() => setEditedProfile(prev => prev ? { ...prev, interestedInFasting: !prev.interestedInFasting } : prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none ${editedProfile?.interestedInFasting ? 'bg-primary' : 'bg-input'}`}
              >
                <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform mt-0.5 ${editedProfile?.interestedInFasting ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Seção: Limitações Médicas */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">{t.settings.profile.healthSection}</p>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm">{t.settings.profile.hasLimitations}</span>
              <button
                type="button"
                role="switch"
                aria-checked={editedProfile?.medicalLimitations?.hasLimitation}
                onClick={() => setEditedProfile(prev => prev ? {
                  ...prev,
                  medicalLimitations: {
                    hasLimitation: !prev.medicalLimitations?.hasLimitation,
                    description: prev.medicalLimitations?.description
                  }
                } : prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none ${editedProfile?.medicalLimitations?.hasLimitation ? 'bg-primary' : 'bg-input'}`}
              >
                <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform mt-0.5 ${editedProfile?.medicalLimitations?.hasLimitation ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {editedProfile?.medicalLimitations?.hasLimitation && (
              <div className="space-y-2">
                <Label htmlFor="edit-medical-desc">{t.settings.profile.describeLimitations}</Label>
                <Textarea
                  id="edit-medical-desc"
                  value={editedProfile?.medicalLimitations?.description || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? {
                    ...prev,
                    medicalLimitations: { hasLimitation: true, description: e.target.value }
                  } : prev)}
                  placeholder={t.settings.profile.limitationsPlaceholder}
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleSaveProfile} className="flex-1">
              {t.settings.profile.saveChanges}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Medida */}
      <Dialog open={showAddMeasurement} onOpenChange={setShowAddMeasurement}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.settings.measurements.newTitle}</DialogTitle>
            <DialogDescription>
              {t.settings.measurements.newDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-weight" className="text-primary font-medium">
                {t.settings.measurements.weight}
              </Label>
              <Input
                id="new-weight"
                type="number"
                step="0.1"
                value={newMeasurement.weight || ''}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                placeholder="Ex: 70.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-waist" className="text-primary font-medium">
                  {t.settings.measurements.waistCm}
                </Label>
                <Input
                  id="new-waist"
                  type="number"
                  step="0.1"
                  value={newMeasurement.waist || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, waist: parseFloat(e.target.value) }))}
                  placeholder="Ex: 80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-hips" className="text-primary font-medium">
                  {t.settings.measurements.hipsCm}
                </Label>
                <Input
                  id="new-hips"
                  type="number"
                  step="0.1"
                  value={newMeasurement.hips || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, hips: parseFloat(e.target.value) }))}
                  placeholder="Ex: 95"
                />
              </div>
            </div>

            <Separator />
            <p className="text-sm text-muted-foreground">{t.settings.measurements.optional}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-neck">{t.settings.measurements.neck}</Label>
                <Input
                  id="new-neck"
                  type="number"
                  step="0.1"
                  value={newMeasurement.neck || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, neck: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-chest">{t.settings.measurements.chest}</Label>
                <Input
                  id="new-chest"
                  type="number"
                  step="0.1"
                  value={newMeasurement.chest || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, chest: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 95"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-thigh">{t.settings.measurements.thigh}</Label>
                <Input
                  id="new-thigh"
                  type="number"
                  step="0.1"
                  value={newMeasurement.thigh || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, thigh: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 55"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-arm">{t.settings.measurements.arm}</Label>
                <Input
                  id="new-arm"
                  type="number"
                  step="0.1"
                  value={newMeasurement.arm || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, arm: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-calf">{t.settings.measurements.calf}</Label>
                <Input
                  id="new-calf"
                  type="number"
                  step="0.1"
                  value={newMeasurement.calf || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, calf: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-bodyfat">{t.settings.measurements.bodyFat}</Label>
                <Input
                  id="new-bodyfat"
                  type="number"
                  step="0.1"
                  value={newMeasurement.bodyFat || ''}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, bodyFat: parseFloat(e.target.value) || undefined }))}
                  placeholder="Ex: 20.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-notes">{t.settings.measurements.notes}</Label>
              <Textarea
                id="new-notes"
                value={newMeasurement.notes || ''}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t.settings.measurements.notesPlaceholder}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddMeasurement(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleAddMeasurement} className="flex-1">
              {t.settings.measurements.saveMeasurement}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t.settings.deleteConfirm.title}
            </DialogTitle>
            <DialogDescription>
              {t.settings.deleteConfirm.description}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">{t.settings.deleteConfirm.warning}</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t.settings.deleteConfirm.item1}</li>
              <li>{t.settings.deleteConfirm.item2}</li>
              <li>{t.settings.deleteConfirm.item3}</li>
              <li>{t.settings.deleteConfirm.item4}</li>
              <li>{t.settings.deleteConfirm.item5}</li>
              <li>{t.settings.deleteConfirm.item6}</li>
              <li>{t.settings.deleteConfirm.item7}</li>
            </ul>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteData}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.settings.deleteConfirm.deleteAll}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
