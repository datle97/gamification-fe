/**
 * Condition types matching backend gamification system
 * Based on: /at.zdx.api/src/modules/gamification/common/types/condition.types.ts
 */

export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in'

export type ConditionValue = string | number | boolean | (string | number)[]

export interface Condition {
  field: string
  op: ConditionOperator
  value: ConditionValue
}

export type ConditionMode = 'AND' | 'OR'

export interface ConditionGroup {
  mode: ConditionMode
  conditions: (Condition | ConditionGroup)[]
}

export type Conditions = Condition | Condition[] | ConditionGroup
