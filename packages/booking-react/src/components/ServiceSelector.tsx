import type { Service } from "@openbooking/core";

export interface ServiceSelectorProps {
  services: readonly Service[];
  selectedServiceId?: string;
  onSelectService: (serviceId: string) => void;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService
}: ServiceSelectorProps) {
  return (
    <div className="ob-service-selector">
      {services.map((service) => (
        <button
          className="ob-button"
          data-selected={service.id === selectedServiceId}
          key={service.id}
          onClick={() => onSelectService(service.id)}
          type="button"
        >
          <span>{service.name}</span>
          <small>{service.durationMinutes} min</small>
        </button>
      ))}
    </div>
  );
}
