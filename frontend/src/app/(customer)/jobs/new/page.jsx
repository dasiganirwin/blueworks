'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

const STEPS = [
  { id: 1, label: 'Job Details' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Photos & Submit' },
];

export default function NewJobPage() {
  const { showToast } = useToast();
  const params = useSearchParams();

  const [form, setForm] = useState({
    category:     params.get('category') ?? 'plumber',
    description:  '',
    address:      '',
    lat:          '',
    lng:          '',
    urgency:      'immediate',
    scheduled_at: '',
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({
    category:    '',
    description: '',
    address:     '',
    urgency:     '',
  });

  // Photos stored as File objects (not FileList)
  const [photos, setPhotos]         = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  // Progress bar step tracking
  const [currentStep, setCurrentStep] = useState(1);

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  const router = useRouter();

  // ── Derived: is the form submittable? ──────────────────────────────────────
  const isSubmittable =
    form.category.trim() !== '' &&
    form.description.trim().length >= 10 &&
    form.address.trim() !== '' &&
    form.lat !== '' &&
    form.lng !== '' &&
    form.urgency.trim() !== '';

  // ── Update currentStep based on IntersectionObserver ──────────────────────
  useEffect(() => {
    const refs = [
      { ref: step1Ref, step: 1 },
      { ref: step2Ref, step: 2 },
      { ref: step3Ref, step: 3 },
    ];

    const observers = refs.map(({ ref, step }) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentStep(step);
          }
        },
        { threshold: 0.5 }
      );
      if (ref.current) observer.observe(ref.current);
      return observer;
    });

    return () => {
      observers.forEach((obs, i) => {
        if (refs[i].ref.current) obs.unobserve(refs[i].ref.current);
        obs.disconnect();
      });
    };
  }, []);

  // ── Generic form field setter + clear that field's error ──────────────────
  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (key in fieldErrors) {
      setFieldErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // ── Validate fields and populate fieldErrors ───────────────────────────────
  const validate = () => {
    const errors = {
      category:    '',
      description: '',
      address:     '',
      urgency:     '',
    };
    let valid = true;

    if (!form.category.trim()) {
      errors.category = 'Please select a service category.';
      valid = false;
    }
    if (form.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
      valid = false;
    }
    if (!form.address.trim() || form.lat === '' || form.lng === '') {
      errors.address = 'Please select an address from the suggestions.';
      valid = false;
    }
    if (!form.urgency.trim()) {
      errors.urgency = 'Please select an urgency level.';
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  // ── Address autocomplete select ────────────────────────────────────────────
  const handleAddressSelect = ({ address, lat, lng }) => {
    setForm(f => ({ ...f, address, lat: String(lat), lng: String(lng) }));
    setFieldErrors(prev => ({ ...prev, address: '' }));
  };

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const MAX_SIZE = 5 * 1024 * 1024;
    const incoming = Array.from(e.target.files);
    const combined = [...photos, ...incoming].slice(0, 5);
    const oversized = combined.filter(f => f.size > MAX_SIZE);

    if (oversized.length) {
      setPhotoError(
        `${oversized.map(f => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} the 5MB limit.`
      );
    } else {
      setPhotoError('');
      setPhotos(combined);
    }
    // Reset the input so the same file can be re-added after removal
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoError('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (photoError) return;

    setError('');
    setLoading(true);
    try {
      const body = {
        category:    form.category,
        description: form.description,
        location: {
          address: form.address,
          lat:     parseFloat(form.lat),
          lng:     parseFloat(form.lng),
        },
        urgency: form.urgency,
        ...(form.urgency === 'scheduled' && { scheduled_at: form.scheduled_at }),
      };
      const { data: job } = await jobsApi.create(body);

      if (photos.length) {
        const fd = new FormData();
        photos.forEach(f => fd.append('photos', f));
        await jobsApi.uploadPhotos(job.id, fd);
      }

      showToast('Job posted successfully!', 'success');
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Post a Job</h1>

      {/* ── Multi-step progress bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((step, idx) => {
          const isActive    = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isLast      = idx === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Circle + label */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                    isCompleted
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : isActive
                        ? 'border-brand-600 text-brand-600 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={[
                    'text-xs mt-1 font-medium whitespace-nowrap',
                    isActive || isCompleted ? 'text-brand-600' : 'text-gray-400',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (skip after last step) */}
              {!isLast && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-1 mt-[-14px] transition-colors',
                    isCompleted ? 'bg-brand-600' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5">

        {/* ── Step 1: Job Details ──────────────────────────────────────────── */}
        <div ref={step1Ref}>
          <Select
            label="Service Category"
            value={form.category}
            onChange={set('category')}
            options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            required
            error={fieldErrors.category}
          />
        </div>

        <Textarea
          label="Describe the job"
          value={form.description}
          onChange={set('description')}
          placeholder="e.g. Leaking pipe under the kitchen sink…"
          required
          error={fieldErrors.description}
        />

        <Select
          label="Urgency"
          value={form.urgency}
          onChange={set('urgency')}
          options={[
            { value: 'immediate', label: 'Immediate — as soon as possible' },
            { value: 'scheduled', label: 'Scheduled — choose a date & time' },
          ]}
          error={fieldErrors.urgency}
        />
        {form.urgency === 'scheduled' && (
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={set('scheduled_at')}
            required
          />
        )}

        {/* ── Step 2: Location ─────────────────────────────────────────────── */}
        <div ref={step2Ref}>
          <AddressAutocomplete
            label="Your address"
            required
            placeholder="Search for your address…"
            error={fieldErrors.address}
            onSelect={handleAddressSelect}
          />
        </div>

        {/* ── Step 3: Photos & Submit ──────────────────────────────────────── */}
        <div ref={step3Ref} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Photos <span className="text-gray-400 font-normal">(optional, max 5 · 5MB each)</span>
            </label>

            {/* Thumbnails grid */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photos.map((file, idx) => {
                  const src = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(src)}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-gray-900/60 text-white flex items-center justify-center hover:bg-gray-900/80 transition-colors"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* File input — only show if fewer than 5 photos selected */}
            {photos.length < 5 && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                aria-label="Upload job photos (up to 5)"
                className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            )}

            {photoError && <p className="text-xs text-danger-600 mt-1">{photoError}</p>}
            {photos.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {photos.length} / 5 photo{photos.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {error && (
            <div id="form-error" role="alert" aria-live="polite" className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!isSubmittable}
            aria-describedby="form-error"
          >
            Post Job
          </Button>

          {!isSubmittable && (
            <p className="text-xs text-gray-400 text-center">
              Fill in all required fields to post your job.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
