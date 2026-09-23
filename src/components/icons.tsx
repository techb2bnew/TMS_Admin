type IconProps = { className?: string };

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" stroke="currentColor" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" stroke="currentColor" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

export function LoadsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M3.5 8.2 12 3.5l8.5 4.7v8.1L12 20.5l-8.5-4.2V8.2Z" stroke="currentColor" strokeLinejoin="round" />
      <path d="M3.7 8.1 12 12.4l8.3-4.3M12 12.4v8.1" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function DispatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M20.5 3.5 3 10.3l6.7 2.6 2.6 6.7 8.2-16.1Z" stroke="currentColor" strokeLinejoin="round" />
      <path d="M9.7 12.9 13 9.6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function DriversIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" />
      <path d="M4.5 20c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function FleetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M2.5 6.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v10H3.5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" />
      <path d="M13.5 10h4.6a1 1 0 0 1 .8.4l2.1 2.75c.13.17.2.38.2.6v2.25a1 1 0 0 1-1 1H13.5V10Z" stroke="currentColor" strokeLinejoin="round" />
      <circle cx="7" cy="18.2" r="1.7" stroke="currentColor" />
      <circle cx="17.3" cy="18.2" r="1.7" stroke="currentColor" />
    </svg>
  );
}

export function TrackingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke="currentColor" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" />
    </svg>
  );
}

export function BillingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M6 3.5h12v17l-2.5-1.6L13 20.5l-1-1.6-1 1.6-2.5-1.6L6 20.5v-17Z" stroke="currentColor" strokeLinejoin="round" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function ReportsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" strokeLinecap="round" />
      <path d="M3 20.5h18" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function NotificationsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path
        d="M6 10.5a6 6 0 0 1 12 0c0 3.4 1 5 1.8 6H4.2c.8-1 1.8-2.6 1.8-6Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M10 19.5a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M9 21H5.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H9" stroke="currentColor" strokeLinecap="round" />
      <path d="M16 16.5 21 12l-5-4.5M21 12H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
      <path d="m20 20-4.5-4.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
      <path d="M12 3.5v12M7.5 11l4.5 4.5L16.5 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17.5v2a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TruckMarkerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="6" width="12" height="9" rx="1.3" fill="currentColor" />
      <path d="M13 9h4.6c.35 0 .68.16.9.44l2 2.5c.16.2.25.46.25.72v1.84a1 1 0 0 1-1 1H13V9Z" fill="currentColor" fillOpacity="0.85" />
      <circle cx="5.5" cy="16.2" r="1.8" fill="#0f172a" stroke="currentColor" strokeWidth="1" />
      <circle cx="17.5" cy="16.2" r="1.8" fill="#0f172a" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
