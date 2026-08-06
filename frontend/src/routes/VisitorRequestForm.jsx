import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Ticket, User, Phone, CreditCard, Building, FileText, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

const GOV_ID_PATTERNS = {
  AADHAAR: { pattern: /^\d{12}$/, example: 'e.g. 123456789012 (12 Digits)' },
  PAN: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/, example: 'e.g. ABCDE1234F' },
  PASSPORT: { pattern: /^[A-Z]{1}\d{7}$/, example: 'e.g. A1234567' },
  DL: { pattern: /^[A-Z]{2}\d{2}\s?\d{11}$/, example: 'e.g. DL0120201234567' },
};

export const VisitorRequestForm = () => {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [govIdType, setGovIdType] = useState('AADHAAR');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [idValidationError, setIdValidationError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await client.get('/students/public');
      setStudents(res.data);
      if (res.data.length > 0) {
        setStudentId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching students', err);
    } fontally {
      setLoadingStudents(false);
    }
  };

  const validatePhoneInput = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length > 0 && !/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Must be a valid 10-digit mobile number starting with 6-9');
      return false;
    } else {
      setPhoneError('');
      return true;
    }
  };

  const validateGovIdInput = (type, number) => {
    if (!number.trim()) {
      setIdValidationError('Government ID number is required');
      return false;
    }
    const rule = GOV_ID_PATTERNS[type];
    if (rule && !rule.pattern.test(number.trim().toUpperCase())) {
      setIdValidationError(`Invalid format for ${type}. Format: ${rule.example}`);
      return false;
    }
    setIdValidationError('');
    return true;
  };

  const handleIdTypeChange = (e) => {
    const newType = e.target.value;
    setGovIdType(newType);
    if (govIdNumber) {
      validateGovIdInput(newType, govIdNumber);
    }
  };

  const handleIdNumberChange = (e) => {
    const val = e.target.value.toUpperCase();
    setGovIdNumber(val);
    validateGovIdInput(govIdType, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError('Phone number must be a valid 10-digit mobile number starting with 6-9');
      setErrorMsg('Please correct the phone number field before submitting.');
      return;
    }

    if (!validateGovIdInput(govIdType, govIdNumber)) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        visitor: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          gov_id_type: govIdType,
          gov_id_number: govIdNumber.trim(),
        },
        student_id: parseInt(studentId),
        purpose: purpose.trim(),
      };

      const res = await client.post('/visitors/requests', payload);
      setSubmittedRequest(res.data);
    } catch (err) {
      let detail = err.response?.data?.detail || 'Failed to submit visitor request. Please try again.';
      if (typeof detail !== 'string' && Array.isArray(detail)) {
        detail = detail.map(d => d.msg?.replace('Value error, ', '') || 'Invalid field').join(', ');
      }
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find((s) => s.id.toString() === studentId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4" /> Fast Gate Pass Verification
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Hostel Visitor Entry Pass Request
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          Submit your visitor details to request host student approval. No account registration required.
        </p>
      </div>

      {/* Success Modal */}
      {submittedRequest ? (
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/30 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Pass Request Submitted!</h2>
            <p className="text-slate-300 text-sm">
              Your visitor request has been sent to host student <strong className="text-sky-300">{submittedRequest.student?.full_name}</strong> (Room {submittedRequest.student?.room_no || 'N/A'}).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Request Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PENDING STUDENT APPROVAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Visitor Name</span>
                <span className="text-white font-medium text-sm">{submittedRequest.visitor?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="text-white font-medium text-sm">{submittedRequest.visitor?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Gov ID Type</span>
                <span className="text-white font-medium text-sm">{submittedRequest.visitor?.gov_id_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Gov ID Number</span>
                <span className="text-white font-medium text-sm font-mono">{submittedRequest.visitor?.gov_id_number}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs leading-relaxed">
            💡 Once your host student approves the request on their phone/dashboard, a 6-character <strong>Passcode</strong> will be generated. Present your passcode to the Security Guard at Gate 1 for instant check-in!
          </div>

          <button
            onClick={() => {
              setSubmittedRequest(null);
              setFullName('');
              setPhone('');
              setGovIdNumber('');
              setPurpose('');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl border border-slate-700 transition-all text-sm"
          >
            Submit Another Visitor Request
          </button>
        </div>
      ) : (
        /* Visitor Request Form */
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Submission Rejected</div>
                <div>{typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Host Student Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4" /> 1. Select Host Student to Visit
              </label>

              {loadingStudents ? (
                <div className="text-xs text-slate-400 py-2">Loading hostel resident directory...</div>
              ) : (
                <div>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} (Room {st.room_no || 'N/A'}) {st.is_available ? '• Available' : '• UNAVAILABLE'}
                      </option>
                    ))}
                  </select>

                  {selectedStudent && (
                    <div className="mt-2 flex items-center justify-between text-xs px-2">
                      <span className="text-slate-400">Host Status:</span>
                      {selectedStudent.is_available ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Available to receive visitors
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          Currently Unavailable (Requests will be rejected)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visitor Identity Details */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" /> 2. Visitor Identity Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    10-Digit Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => validatePhoneInput(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      phoneError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {phoneError ? (
                    <p className="text-[11px] text-rose-400 mt-1 font-medium">{phoneError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">10 digits starting with 6-9</p>
                  )}
                </div>
              </div>

              {/* Gov ID Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gov ID Document Type *
                  </label>
                  <select
                    value={govIdType}
                    onChange={handleIdTypeChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DL">Driving License</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gov ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={govIdNumber}
                    onChange={handleIdNumberChange}
                    placeholder={GOV_ID_PATTERNS[govIdType]?.example}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-white placeholder-slate-500 focus:outline-none transition-all ${
                      idValidationError ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-700 focus:border-sky-500'
                    }`}
                  />
                  {idValidationError && (
                    <div className="text-rose-400 text-xs mt-1 font-medium">{idValidationError}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Visit Purpose */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 3. Reason for Visit
              </label>
              <textarea
                required
                rows="3"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Delivering luggage, meeting family member, project discussion"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (selectedStudent && !selectedStudent.is_available)}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-sky-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  Submit Visitor Pass Request
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
