import React from 'react';
import BoliviaCoverageMap from './BoliviaCoverageMap';

export interface BoliviaInteractiveSvgMapProps {
  onSelectDepartment?: (deptName: string) => void;
  onRequestQuote?: (deptName: string, zoneName?: string) => void;
}

export default function BoliviaInteractiveSvgMap({
  onRequestQuote
}: BoliviaInteractiveSvgMapProps) {
  return <BoliviaCoverageMap onRequestQuote={onRequestQuote} />;
}
