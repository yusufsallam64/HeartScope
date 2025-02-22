import React from 'react';
import Header from '../components/header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  return (
    <Header>
      {children}
    </Header>
  );
};

export default DashboardLayout;