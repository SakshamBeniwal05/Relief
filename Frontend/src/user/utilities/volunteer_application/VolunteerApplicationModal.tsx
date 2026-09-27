import React, { useState } from 'react';
import type { VolunteerApplicationData } from '../../types';

interface VolunteerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitApplication?: (data: VolunteerApplicationData) => void;
}

export const VolunteerApplicationModal: React.FC<VolunteerApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmitApplication,
}) => {
  const [formData, setFormData] = useState<VolunteerApplicationData>({
    fullName: '',
    mobile: '',
    specialization: '4x4 Offroad Driver',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitApplication) {
      onSubmitApplication(formData);
    }
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      id="volunteer-modal"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-secondary-container text-on-secondary-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">volunteer_activism</span>
            <h3 className="font-heading font-bold text-sm">Emergency Volunteer Application</h3>
          </div>
          <button
            className="p-1 rounded-full hover:bg-secondary-container/50 text-on-secondary-container"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#2e7d32]/20 text-[#2e7d32] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <h4 className="font-heading font-bold text-sm text-on-surface">Application Registered!</h4>
            <p className="text-xs text-on-surface-variant">
              NDRF Sector 4 Command has received your credentials. You will receive an instant verification SMS.
            </p>
          </div>
        ) : (
          <form className="p-4 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-[11px] font-bold text-on-surface">Full Name</label>
              <input
                className="w-full mt-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                placeholder="e.g. Major (Retd) Devendra Rawat"
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface">Contact Mobile</label>
              <input
                className="w-full mt-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                placeholder="+91 98765 43210"
                required
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface">Specialized Capability</label>
              <select
                className="w-full mt-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              >
                <option value="4x4 Offroad Driver">4x4 Offroad Driver</option>
                <option value="Paramedic / Doctor">Paramedic / Doctor</option>
                <option value="Ham Radio Operator">Ham Radio Operator</option>
                <option value="Search & Rescue Mountaineer">Search & Rescue Mountaineer</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                className="px-4 py-1.5 rounded-full border border-outline text-xs font-bold text-on-surface"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-colors"
                type="submit"
              >
                Submit Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VolunteerApplicationModal;
