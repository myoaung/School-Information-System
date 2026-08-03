import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const INITIAL = {
  // Step 1: Grade
  grade_id: '',
  // Step 2: Student info
  name: '',
  full_name_mm: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  nationality: 'Myanmar',
  ethnicity: '',
  religion: '',
  nrc_no: '',
  birth_cert_no: '',
  blood_type: '',
  // Step 3: Academic
  enrollment_type: 'new',
  prev_school_name: '',
  prev_school_location: '',
  prev_grade_completed: '',
  transfer_cert_no: '',
  transfer_cert_date: '',
  // Step 4: Parent info
  father_name: '',
  father_nrc: '',
  father_occupation: '',
  father_phone: '',
  father_email: '',
  mother_name: '',
  mother_nrc: '',
  mother_occupation: '',
  mother_phone: '',
  mother_email: '',
  guardian_name: '',
  guardian_relationship: '',
  guardian_nrc: '',
  guardian_phone: '',
  guardian_email: '',
  emergency_contact_name: '',
  emergency_relationship: '',
  emergency_phone2: '',
  // Step 5: Address
  house_no: '',
  street: '',
  ward: '',
  township: '',
  state_region: '',
  permanent_address: '',
  // Step 6: Health
  medical_conditions: '',
  medications: '',
  special_needs: '',
  emergency_medical_consent: false,
};

const STEPS = ['Grade', 'Student Info', 'Academic', 'Parent Info', 'Address', 'Health', 'Review'];

const ETHNICITIES = [
  'Bamar',
  'Shan',
  'Karen',
  'Rakhine',
  'Mon',
  'Chin',
  'Kachin',
  'Kayah',
  'Chin',
  'Mro',
  'Danu',
  'Naga',
  'Lahu',
  'Wa',
  'Palaung',
  'Intha',
  'Other',
];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const STATES_REGIONS = [
  'Ayeyarwady',
  'Bago',
  'Magway',
  'Mandalay',
  'Sagaing',
  'Tanintharyi',
  'Yangon',
  'Shan',
  'Kayin',
  'Kayah',
  'Mon',
  'Rakhine',
  'Chin',
  'Kachin',
  'Naypyidaw',
];

function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 outline-none"
      />
    </div>
  );
}

function Select({ label, required, children, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        {...props}
        className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/registration/open')
      .then((res) => {
        const periods = res.data.periods || [];
        const mapped = periods
          .map((p) => ({
            id: p.grade_id,
            name: p.grade_name || `Grade ${p.grade_id}`,
            seatsLeft: p.max_seats - p.current_seats,
            maxSeats: p.max_seats,
            endDate: p.end_date,
          }))
          .filter((g) => g.seatsLeft > 0);
        setGrades(mapped);
      })
      .catch(() => {});
  }, []);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setError('');
  };

  const selectGrade = (g) => {
    setForm((f) => ({ ...f, grade_id: g.id }));
    setSelectedGrade(g);
  };

  const next = () => {
    if (step === 0 && !form.grade_id) return setError('Please select a grade');
    if (step === 1) {
      if (!form.name || !form.email || !form.password)
        return setError('Name, email, and password are required');
      if (form.password.length < 8) return setError('Password must be at least 8 characters');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { confirmPassword, ...payload } = form;
      await api.post('/registration/submit', payload);
      navigate('/login', {
        state: {
          message: 'Registration successful! Please check your email for login credentials.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 outline-none';
  const labelCls = 'block text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl mb-3"
          >
            <svg
              className="w-7 h-7 text-purple-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </Link>
          <h2 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">
            Student Registration
          </h2>
          <p className="text-xs text-purple-500 mt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6 px-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-400'}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded ${i < step ? 'bg-green-500' : 'bg-purple-100'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mb-4">
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            Step {step + 1}: {STEPS[step]}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-purple-100/50 p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Grade Selection */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-purple-600 mb-2">
                Select the grade you wish to apply for:
              </p>
              {grades.length === 0 ? (
                <div className="text-center py-8 text-purple-400">
                  No registration periods are currently open
                </div>
              ) : (
                <div className="grid gap-3">
                  {grades.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => selectGrade(g)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all cursor-pointer ${form.grade_id === g.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30' : 'border-purple-100 hover:border-purple-300'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-purple-900 dark:text-purple-100">
                          {g.name}
                        </span>
                        <span
                          className={`text-sm font-medium ${g.seatsLeft <= 5 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {g.seatsLeft} seats left
                        </span>
                      </div>
                      <div className="text-xs text-purple-400 mt-1">
                        Closes {new Date(g.endDate).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Student Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name (English)"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Aung Aung"
                />
                <Input
                  label="Full Name (Myanmar)"
                  value={form.full_name_mm}
                  onChange={set('full_name_mm')}
                  placeholder="အောင်အောင်"
                />
              </div>
              <Input
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="student@email.com"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  required
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 characters"
                />
                <Input
                  label="Confirm Password"
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter password"
                />
              </div>
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+95 9 123 456 789"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={set('date_of_birth')}
                />
                <Select label="Gender" value={form.gender} onChange={set('gender')}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
                <Select label="Blood Type" value={form.blood_type} onChange={set('blood_type')}>
                  <option value="">Select</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
                <Select label="Ethnicity" value={form.ethnicity} onChange={set('ethnicity')}>
                  <option value="">Select</option>
                  {ETHNICITIES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
                <Select label="Religion" value={form.religion} onChange={set('religion')}>
                  <option value="">Select</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Islam">Islam</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="NRC No."
                  value={form.nrc_no}
                  onChange={set('nrc_no')}
                  placeholder="1234567"
                />
                <Input
                  label="Birth Certificate No."
                  value={form.birth_cert_no}
                  onChange={set('birth_cert_no')}
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic */}
          {step === 2 && (
            <div className="space-y-4">
              <Select
                label="Enrollment Type"
                required
                value={form.enrollment_type}
                onChange={set('enrollment_type')}
              >
                <option value="new">New Student</option>
                <option value="transfer">Transfer Student</option>
                <option value="readmission">Re-admission</option>
              </Select>
              {form.enrollment_type !== 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Previous School Name"
                    value={form.prev_school_name}
                    onChange={set('prev_school_name')}
                  />
                  <Input
                    label="Previous School Location"
                    value={form.prev_school_location}
                    onChange={set('prev_school_location')}
                  />
                  <Input
                    label="Grade Completed"
                    value={form.prev_grade_completed}
                    onChange={set('prev_grade_completed')}
                  />
                  <Input
                    label="Transfer Certificate No."
                    value={form.transfer_cert_no}
                    onChange={set('transfer_cert_no')}
                  />
                  <Input
                    label="Transfer Cert. Date"
                    type="date"
                    value={form.transfer_cert_date}
                    onChange={set('transfer_cert_date')}
                  />
                </div>
              )}
              {form.enrollment_type === 'new' && (
                <p className="text-sm text-purple-400 italic">
                  No additional academic information required for new students.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Parent Info */}
          {step === 3 && (
            <div className="space-y-5">
              {[
                { prefix: 'father', title: 'Father' },
                { prefix: 'mother', title: 'Mother' },
                { prefix: 'guardian', title: 'Guardian (if applicable)' },
              ].map(({ prefix, title }) => (
                <div
                  key={prefix}
                  className="p-3 border border-purple-100 dark:border-gray-800 rounded-xl space-y-3"
                >
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label={`${title} Name`}
                      value={form[`${prefix}_name`]}
                      onChange={set(`${prefix}_name`)}
                    />
                    <Input
                      label="NRC No."
                      value={form[`${prefix}_nrc`]}
                      onChange={set(`${prefix}_nrc`)}
                    />
                    {prefix !== 'guardian' && (
                      <Input
                        label="Occupation"
                        value={form[`${prefix}_occupation`]}
                        onChange={set(`${prefix}_occupation`)}
                      />
                    )}
                    {prefix === 'guardian' && (
                      <Input
                        label="Relationship"
                        value={form[`${prefix}_relationship`]}
                        onChange={set(`${prefix}_relationship`)}
                      />
                    )}
                    <Input
                      label="Phone"
                      type="tel"
                      value={form[`${prefix}_phone`]}
                      onChange={set(`${prefix}_phone`)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form[`${prefix}_email`]}
                      onChange={set(`${prefix}_email`)}
                    />
                  </div>
                </div>
              ))}
              <div className="p-3 border border-red-100 dark:border-red-900/30 rounded-xl space-y-3 bg-red-50/30">
                <h4 className="text-sm font-bold text-red-700 dark:text-red-300">
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Name"
                    required
                    value={form.emergency_contact_name}
                    onChange={set('emergency_contact_name')}
                  />
                  <Input
                    label="Relationship"
                    required
                    value={form.emergency_relationship}
                    onChange={set('emergency_relationship')}
                  />
                  <Input
                    label="Phone"
                    required
                    type="tel"
                    value={form.emergency_phone2}
                    onChange={set('emergency_phone2')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Address */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="House No." value={form.house_no} onChange={set('house_no')} />
                <Input label="Street" value={form.street} onChange={set('street')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ward" value={form.ward} onChange={set('ward')} />
                <Input label="Township" value={form.township} onChange={set('township')} />
              </div>
              <Select
                label="State / Region"
                value={form.state_region}
                onChange={set('state_region')}
              >
                <option value="">Select</option>
                {STATES_REGIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <div>
                <label className={labelCls}>Permanent Address (if different)</label>
                <textarea
                  rows={2}
                  value={form.permanent_address}
                  onChange={set('permanent_address')}
                  className={inputCls + ' resize-none'}
                  placeholder="Full address if different from above"
                />
              </div>
            </div>
          )}

          {/* Step 5: Health */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Medical Conditions</label>
                <textarea
                  rows={2}
                  value={form.medical_conditions}
                  onChange={set('medical_conditions')}
                  className={inputCls + ' resize-none'}
                  placeholder="Any chronic conditions, disabilities, etc."
                />
              </div>
              <div>
                <label className={labelCls}>Current Medications</label>
                <textarea
                  rows={2}
                  value={form.medications}
                  onChange={set('medications')}
                  className={inputCls + ' resize-none'}
                  placeholder="List any medications being taken"
                />
              </div>
              <div>
                <label className={labelCls}>Special Needs / Accommodations</label>
                <textarea
                  rows={2}
                  value={form.special_needs}
                  onChange={set('special_needs')}
                  className={inputCls + ' resize-none'}
                  placeholder="Learning disabilities, physical needs, etc."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.emergency_medical_consent}
                  onChange={set('emergency_medical_consent')}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  I consent to emergency medical treatment if necessary
                </span>
              </label>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-4 text-sm">
              {[
                { label: 'Grade', value: selectedGrade?.name },
                { label: 'Name', value: form.name },
                { label: 'Name (MM)', value: form.full_name_mm },
                { label: 'Email', value: form.email },
                { label: 'DOB', value: form.date_of_birth },
                { label: 'Gender', value: form.gender },
                { label: 'Nationality', value: form.nationality },
                { label: 'Ethnicity', value: form.ethnicity },
                { label: 'Religion', value: form.religion },
                { label: 'NRC', value: form.nrc_no },
                { label: 'Enrollment', value: form.enrollment_type },
                { label: 'Father', value: form.father_name },
                { label: 'Mother', value: form.mother_name },
                {
                  label: 'Emergency',
                  value: `${form.emergency_contact_name} (${form.emergency_phone2})`,
                },
                {
                  label: 'Address',
                  value: [form.house_no, form.street, form.ward, form.township, form.state_region]
                    .filter(Boolean)
                    .join(', '),
                },
                { label: 'Medical Consent', value: form.emergency_medical_consent ? 'Yes' : 'No' },
              ]
                .filter((r) => r.value)
                .map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between py-1 border-b border-purple-50 dark:border-gray-800"
                  >
                    <span className="text-purple-500 font-medium">{r.label}</span>
                    <span className="text-purple-900 dark:text-purple-100 text-right max-w-[60%]">
                      {r.value}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-purple-100 dark:border-gray-800">
            {step > 0 ? (
              <button
                onClick={prev}
                className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
