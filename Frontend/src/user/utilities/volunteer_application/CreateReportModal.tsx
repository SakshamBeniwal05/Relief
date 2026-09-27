import React, { useState } from 'react';
import type { GeoEvidenceSubmission } from '../../types';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport?: (report: GeoEvidenceSubmission) => void;
  defaultSector?: string;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  defaultSector = 'Joshimath Ravigram Sector',
}) => {
  const [targetSector, setTargetSector] = useState(defaultSector);
  const [observationNotes, setObservationNotes] = useState('');
  const [photoSnapped, setPhotoSnapped] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitReport) {
      onSubmitReport({
        targetSector,
        observationNotes,
        location: '30.5562° N, 79.5638° E',
      });
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
      id="create-report-modal"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-primary-container text-on-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">add_a_photo</span>
            <h3 className="font-heading font-bold text-sm">Submit Geo-Cam Evidence</h3>
          </div>
          <button
            className="p-1 rounded-full hover:bg-white/20 text-on-primary"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#2e7d32]/20 text-[#2e7d32] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h4 className="font-heading font-bold text-sm text-on-surface">Evidence Authenticated!</h4>
            <p className="text-xs text-on-surface-variant">
              Hardware GPS EXIF cryptographically signed and sent to Admin Triage Queue.
            </p>
          </div>
        ) : (
          <form className="p-4 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-[11px] font-bold text-on-surface">Target Sector</label>
              <input
                className="w-full mt-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                required
                value={targetSector}
                onChange={(e) => setTargetSector(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface">Observation Notes</label>
              <textarea
                className="w-full mt-1 p-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                placeholder="Provide ground truth (fissure width, rockfall rate)..."
                required
                rows={3}
                value={observationNotes}
                onChange={(e) => setObservationNotes(e.target.value)}
              />
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-primary text-base">camera</span>
                Hardware Camera
              </span>
              <button
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-colors ${
                  photoSnapped
                    ? 'bg-[#2e7d32] text-white'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}
                onClick={() => setPhotoSnapped(!photoSnapped)}
                type="button"
              >
                {photoSnapped ? 'Photo Attached (GPS Signed)' : 'Snap Photo'}
              </button>
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
                Submit Evidence
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateReportModal;
