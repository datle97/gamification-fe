import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  useSettingsStore,
  getDefaultFeatures,
  getDefaultUI,
  type DateFormat,
  type AutoRefreshInterval,
} from '@/stores/settingsStore'
import {
  RotateCcw,
  FlaskConical,
  Palette,
  Save,
  Moon,
  Rows3,
  Calendar,
  RefreshCw,
  Table,
  Wrench,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LocalSettings {
  features: {
    devMode: boolean
    analytics: boolean
  }
  ui: {
    darkMode: boolean
    compactTables: boolean
    dateFormat: DateFormat
    autoRefreshInterval: AutoRefreshInterval
    tablePageSize: number
  }
}

export function SettingsPage() {
  const { features, ui, saveSettings } = useSettingsStore()

  // Local state for editing
  const [local, setLocal] = useState<LocalSettings>({
    features: { ...features },
    ui: { ...ui },
  })

  // Sync local state when store changes (e.g., after reset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal({
      features: { ...features },
      ui: { ...ui },
    })
  }, [features, ui])

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return (
      local.features.devMode !== features.devMode ||
      local.features.analytics !== features.analytics ||
      local.ui.darkMode !== ui.darkMode ||
      local.ui.compactTables !== ui.compactTables ||
      local.ui.dateFormat !== ui.dateFormat ||
      local.ui.autoRefreshInterval !== ui.autoRefreshInterval ||
      local.ui.tablePageSize !== ui.tablePageSize
    )
  }, [local, features, ui])

  const handleSave = () => {
    saveSettings({
      features: local.features,
      ui: local.ui,
    })
  }

  const handleReset = () => {
    // Set local state to defaults - user must click Save to apply
    setLocal({
      features: getDefaultFeatures(),
      ui: getDefaultUI(),
    })
  }

  const handleDiscard = () => {
    setLocal({
      features: { ...features },
      ui: { ...ui },
    })
  }

  // Update local feature
  const setFeature = (key: keyof LocalSettings['features'], value: boolean) => {
    setLocal((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }))
  }

  // Update local UI setting
  const setUI = <K extends keyof LocalSettings['ui']>(key: K, value: LocalSettings['ui'][K]) => {
    setLocal((prev) => ({
      ...prev,
      ui: { ...prev.ui, [key]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Badge variant="secondary">Unsaved changes</Badge>
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                Discard
              </Button>
            </>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>Enable or disable experimental features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="devMode" className="text-base">
                    Dev Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show testing tools like grant turns, reset missions, and revoke rewards
                  </p>
                </div>
              </div>
              <Switch
                id="devMode"
                checked={local.features.devMode}
                onCheckedChange={(checked) => setFeature('devMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="analytics" className="text-base">
                    Analytics
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show charts and analytics visualizations
                  </p>
                </div>
              </div>
              <Switch
                id="analytics"
                checked={local.features.analytics}
                onCheckedChange={(checked) => setFeature('analytics', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode" className="text-base">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Use dark color scheme</p>
                </div>
              </div>
              <Switch
                id="darkMode"
                checked={local.ui.darkMode}
                onCheckedChange={(checked) => setUI('darkMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rows3 className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="compactTables" className="text-base">
                    Compact Tables
                  </Label>
                  <p className="text-sm text-muted-foreground">Use denser table rows</p>
                </div>
              </div>
              <Switch
                id="compactTables"
                checked={local.ui.compactTables}
                onCheckedChange={(checked) => setUI('compactTables', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Data Display
            </CardTitle>
            <CardDescription>Configure how data is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="dateFormat" className="text-base">
                    Date Format
                  </Label>
                  <p className="text-sm text-muted-foreground">How dates are displayed</p>
                </div>
              </div>
              <Select
                value={local.ui.dateFormat}
                onValueChange={(value) => setUI('dateFormat', value as DateFormat)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="autoRefresh" className="text-base">
                    Auto Refresh
                  </Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh data</p>
                </div>
              </div>
              <Select
                value={local.ui.autoRefreshInterval.toString()}
                onValueChange={(value) =>
                  setUI('autoRefreshInterval', parseInt(value, 10) as AutoRefreshInterval)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Disabled</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Table className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="tablePageSize" className="text-base">
                    Table Page Size
                  </Label>
                  <p className="text-sm text-muted-foreground">Rows per page in tables</p>
                </div>
              </div>
              <Select
                value={local.ui.tablePageSize.toString()}
                onValueChange={(value) => setUI('tablePageSize', parseInt(value, 10))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Settings
            </CardTitle>
            <CardDescription>Reset all settings to their default values</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
