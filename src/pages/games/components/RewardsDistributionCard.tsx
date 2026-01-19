import { useMemo, useState } from 'react'
import { Loader2, AlertTriangle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useRewardDistribution } from '@/hooks/queries'

interface RewardsDistributionCardProps {
  gameId: string
}

type ChartMode = 'pie' | 'bar'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-5)',
  'var(--chart-3)',
  'var(--chart-4)',
]

export function RewardsDistributionCard({ gameId }: RewardsDistributionCardProps) {
  const { data: distribution = [], isLoading } = useRewardDistribution(gameId)
  const [chartMode, setChartMode] = useState<ChartMode>('bar')

  const stats = useMemo(() => {
    if (distribution.length === 0) {
      return {
        totalDistributed: 0,
        uniqueRewards: 0,
        avgDeviation: 0,
        issuesCount: 0,
      }
    }

    const totalDistributed = distribution.reduce((sum, d) => sum + d.actualCount, 0)
    const uniqueRewards = distribution.length
    const avgDeviation =
      distribution.reduce((sum, d) => sum + Math.abs(d.deviation), 0) / distribution.length
    const issuesCount = distribution.filter((d) => d.status !== 'ok').length

    return {
      totalDistributed,
      uniqueRewards,
      avgDeviation: Math.round(avgDeviation * 10) / 10,
      issuesCount,
    }
  }, [distribution])

  const pieChartData = useMemo(() => {
    return distribution
      .filter((d) => d.actualCount > 0)
      .sort((a, b) => b.actualCount - a.actualCount)
      .map((d, index) => ({
        name: d.name,
        value: d.actualCount,
        fill: COLORS[index % COLORS.length],
      }))
  }, [distribution])

  const barChartData = useMemo(() => {
    return distribution
      .filter((d) => d.actualCount > 0)
      .sort((a, b) => b.actualCount - a.actualCount)
      .map((d) => ({
        name: d.name,
        expected: d.expectedCount,
        actual: d.actualCount,
      }))
  }, [distribution])

  const chartConfig: ChartConfig = {
    expected: {
      label: 'Expected',
      color: 'var(--chart-3)',
    },
    actual: {
      label: 'Actual',
      color: 'var(--chart-1)',
    },
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reward Distribution Analytics</CardTitle>
          <CardDescription>Loading distribution data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (distribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reward Distribution Analytics</CardTitle>
          <CardDescription>Monitor actual vs expected reward allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            <p>No distribution data yet. Rewards will appear here once users start playing.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reward Distribution Analytics</CardTitle>
            <CardDescription>
              Actual vs expected distribution based on probability settings
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats.issuesCount > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.issuesCount} issue{stats.issuesCount > 1 ? 's' : ''}
              </Badge>
            )}
            {/* Chart mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-md">
              <Button
                variant={chartMode === 'pie' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartMode('pie')}
                className="h-7 px-2"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartMode === 'bar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChartMode('bar')}
                className="h-7 px-2"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Distributed</p>
            <p className="text-2xl font-semibold tabular-nums">{stats.totalDistributed}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Unique Rewards</p>
            <p className="text-2xl font-semibold tabular-nums">{stats.uniqueRewards}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Deviation</p>
            <p className="text-2xl font-semibold tabular-nums">{stats.avgDeviation}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Distribution Issues</p>
            <p className="text-2xl font-semibold tabular-nums">{stats.issuesCount}</p>
          </div>
        </div>

        {/* Chart */}
        {chartMode === 'pie' && pieChartData.length > 0 && (
          <div className="space-y-2 -mx-6">
            <div className="px-6">
              <h4 className="text-sm font-medium">Actual Distribution</h4>
            </div>
            <ChartContainer config={chartConfig} className="h-96 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  label={({ name, percent }) => {
                    return `${name}: ${(percent * 100).toFixed(0)}%`
                  }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {chartMode === 'bar' && barChartData.length > 0 && (
          <div className="space-y-2 -mx-6">
            <div className="px-6">
              <h4 className="text-sm font-medium">Expected vs Actual Distribution</h4>
            </div>
            <ChartContainer config={chartConfig} className="h-96 w-full">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis type="number" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="expected" fill="var(--color-expected)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
