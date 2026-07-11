import { useState } from "react";

export interface BookingFormValues {
  name: string;
  email: string;
  notes: string;
}

export interface BookingFormProps {
  disabled?: boolean;
  onSubmit: (values: BookingFormValues) => void;
}

export function BookingForm({ disabled, onSubmit }: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>({
    name: "",
    email: "",
    notes: ""
  });

  return (
    <form
      className="ob-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <label className="ob-field">
        <span>Name</span>
        <input
          required
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.currentTarget.value })}
        />
      </label>
      <label className="ob-field">
        <span>Email</span>
        <input
          required
          type="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.currentTarget.value })}
        />
      </label>
      <label className="ob-field">
        <span>Notes</span>
        <textarea
          value={values.notes}
          onChange={(event) => setValues({ ...values, notes: event.currentTarget.value })}
        />
      </label>
      <button className="ob-submit" disabled={disabled} type="submit">
        Request booking
      </button>
    </form>
  );
}
