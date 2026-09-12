import React from 'react';
import { View } from '@/field-ops/components/primitives';
import { useAuth } from '@/field-ops/context/AuthContext';
import { AdminDashboard } from '@/field-ops/components/dashboards/AdminDashboard';
import { OwnerDashboard } from '@/field-ops/components/dashboards/OwnerDashboard';
import { HeadSupervisorDashboard } from '@/field-ops/components/dashboards/HeadSupervisorDashboard';
import { AccountantDashboard } from '@/field-ops/components/dashboards/AccountantDashboard';
import { AssistantSupervisorDashboard } from '@/field-ops/components/dashboards/AssistantSupervisorDashboard';
import { DriverDashboard } from '@/field-ops/components/dashboards/DriverDashboard';
import { SurveyorDashboard } from '@/field-ops/components/dashboards/SurveyorDashboard';
import { UserRole } from '@/field-ops/types';
import type { TabId } from '@/field-ops/lib/rbac';

export interface SurveyNavParams {
  openNewSurvey?: boolean;
  openReviseSurveyId?: string;
  /** Navigate to Surveys tab filtered by this date (YYYY-MM-DD). Used when clicking a day in Excavation production. */
  filterByDate?: string;
}

export interface DashboardNavProps {
  onNavigateTab?: (tab: TabId, params?: SurveyNavParams) => void;
}

const DASHBOARDS: Record<UserRole, React.ComponentType<DashboardNavProps>> = {
  admin: AdminDashboard,
  owner: OwnerDashboard,
  head_supervisor: HeadSupervisorDashboard,
  accountant: AccountantDashboard,
  assistant_supervisor: AssistantSupervisorDashboard,
  surveyor: SurveyorDashboard,
  driver_truck: DriverDashboard,
  driver_machine: DriverDashboard,
};

export function RoleBasedDashboard({ onNavigateTab }: DashboardNavProps) {
  const { user } = useAuth();

  if (!user) {
    return <View className="flex-1 bg-gray-50" />;
  }

  const DashboardComponent = DASHBOARDS[user.role];

  return <DashboardComponent onNavigateTab={onNavigateTab} />;
}
