import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RestrictionsConfig {
  blacklist?: {
    phones?: string[]
    message?: string
  }
  whitelist?: {
    phones?: string[]
    message?: string
  }
}

interface GameRestrictionsSectionProps {
  restrictions: RestrictionsConfig | undefined
  onChange: (restrictions: RestrictionsConfig | undefined) => void
}

export function GameRestrictionsSection({ restrictions, onChange }: GameRestrictionsSectionProps) {
  const blacklistEnabled = !!restrictions?.blacklist
  const whitelistEnabled = !!restrictions?.whitelist

  const blacklistPhones = restrictions?.blacklist?.phones?.join('\n') || ''
  const blacklistMessage = restrictions?.blacklist?.message

  const whitelistPhones = restrictions?.whitelist?.phones?.join('\n') || ''
  const whitelistMessage = restrictions?.whitelist?.message

  const setBlacklistEnabled = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...restrictions,
        blacklist: {
          phones: [],
          message: '',
        },
      })
    } else {
      onChange({
        ...restrictions,
        blacklist: undefined,
      })
    }
  }

  const setWhitelistEnabled = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...restrictions,
        whitelist: {
          phones: [],
          message: '',
        },
      })
    } else {
      onChange({
        ...restrictions,
        whitelist: undefined,
      })
    }
  }

  const setBlacklistPhones = (value: string) => {
    onChange({
      ...restrictions,
      blacklist: {
        ...restrictions?.blacklist,
        phones: value
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      },
    })
  }

  const setBlacklistMessage = (value: string) => {
    onChange({
      ...restrictions,
      blacklist: {
        ...restrictions?.blacklist,
        message: value || undefined,
      },
    })
  }

  const setWhitelistPhones = (value: string) => {
    onChange({
      ...restrictions,
      whitelist: {
        ...restrictions?.whitelist,
        phones: value
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      },
    })
  }

  const setWhitelistMessage = (value: string) => {
    onChange({
      ...restrictions,
      whitelist: {
        ...restrictions?.whitelist,
        message: value || undefined,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Restrictions</CardTitle>
        <CardDescription>Control who can access and play this game</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blacklist Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Blacklist</h4>
              <p className="text-xs text-muted-foreground">
                Users in blacklist will be blocked regardless of whitelist
              </p>
            </div>
            <Checkbox
              id="enable-blacklist"
              checked={blacklistEnabled}
              onCheckedChange={(checked) => setBlacklistEnabled(checked === true)}
            />
          </div>

          {blacklistEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blacklistPhones">Blocked Phone Numbers (one per line)</Label>
                <Textarea
                  id="blacklistPhones"
                  placeholder="0901234567&#10;0987654321"
                  value={blacklistPhones}
                  onChange={(e) => setBlacklistPhones(e.target.value)}
                  className="min-h-24 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blacklistMessage">Error Message</Label>
                <Input
                  id="blacklistMessage"
                  placeholder="Bạn không thể tham gia chương trình này."
                  value={blacklistMessage}
                  onChange={(e) => setBlacklistMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Whitelist Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Whitelist</h4>
              <p className="text-xs text-muted-foreground">
                If enabled, ONLY users in whitelist can play
              </p>
            </div>
            <Checkbox
              id="enable-whitelist"
              checked={whitelistEnabled}
              onCheckedChange={(checked) => setWhitelistEnabled(checked === true)}
            />
          </div>

          {whitelistEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whitelistPhones">Allowed Phone Numbers (one per line)</Label>
                <Textarea
                  id="whitelistPhones"
                  placeholder="0901111111&#10;0902222222"
                  value={whitelistPhones}
                  onChange={(e) => setWhitelistPhones(e.target.value)}
                  className="min-h-24 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whitelistMessage">Error Message</Label>
                <Input
                  id="whitelistMessage"
                  placeholder="Bạn không thể tham gia chương trình này."
                  value={whitelistMessage}
                  onChange={(e) => setWhitelistMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
