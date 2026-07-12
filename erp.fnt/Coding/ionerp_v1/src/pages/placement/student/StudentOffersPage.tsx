import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Download, CheckCircle, XCircle, MapPin, Calendar, DollarSign, Briefcase, Info } from "lucide-react";
import axiosInstance from "../../../utils/api";
import offerManagementService from "../tpoDashboard/offer-management/offerManagementService";

interface StudentOffersPageProps {
  studentId: number;
}

interface Offer {
  id: number;
  company_name: string;
  drive_name: string;
  designation: string;
  package_ctc: string;
  location: string;
  offer_date: string;
  joining_date: string;
  status: string;
}

const StudentOffersPage: React.FC<StudentOffersPageProps> = ({ studentId }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Decline modal states
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submittingDecline, setSubmittingDecline] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const res: any = await axiosInstance.get(`placement/offer/student/my-offers?student_id=${studentId}`);
      setOffers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load student offers", err);
      toast.error("Failed to load your offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadOffers();
    }
  }, [studentId]);

  const handleAccept = async (offerId: number) => {
    if (!window.confirm("Are you sure you want to ACCEPT this offer? This will apply the placement policy rules and may lock your profile from other drives.")) {
      return;
    }

    try {
      const payload = {
        offer_id: offerId,
        status: "Accepted"
      };
      await axiosInstance.post("placement/offer/student/respond", payload);
      toast.success("Offer accepted successfully!");
      loadOffers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to accept offer.";
      toast.error(msg);
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferId || !declineReason.trim()) return;

    setSubmittingDecline(true);
    try {
      const payload = {
        offer_id: selectedOfferId,
        status: "Rejected",
        remarks: declineReason
      };
      await axiosInstance.post("placement/offer/student/respond", payload);
      toast.success("Offer declined successfully.");
      setIsDeclineModalOpen(false);
      setDeclineReason("");
      setSelectedOfferId(null);
      loadOffers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to decline offer.";
      toast.error(msg);
    } finally {
      setSubmittingDecline(false);
    }
  };

  const getStatusColorConfig = (status: string) => {
    switch (status) {
      case "Accepted":
        return {
          bg: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
          dot: "bg-emerald-500",
          gradient: "from-emerald-500 to-teal-600",
          cardBorder: "hover:border-emerald-400 dark:hover:border-emerald-900"
        };
      case "Rejected":
        return {
          bg: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
          dot: "bg-rose-500",
          gradient: "from-rose-500 to-red-600",
          cardBorder: "hover:border-rose-400 dark:hover:border-rose-900"
        };
      case "Revoked":
        return {
          bg: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
          dot: "bg-amber-500",
          gradient: "from-amber-500 to-orange-600",
          cardBorder: "hover:border-amber-400 dark:hover:border-amber-900"
        };
      case "Sent":
      case "Generated":
        return {
          bg: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
          dot: "bg-blue-500",
          gradient: "from-blue-500 to-indigo-600",
          cardBorder: "hover:border-blue-400 dark:hover:border-blue-900"
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
          dot: "bg-gray-500",
          gradient: "from-gray-500 to-slate-600",
          cardBorder: "hover:border-gray-400 dark:hover:border-gray-700"
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Page Header */}
      <div className="mb-10 text-left">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          My Placement Offers
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Review details of job offers received through campus placement, download letter copies, and confirm your selection.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-10 text-center shadow-sm max-w-lg mx-auto">
          <Briefcase className="h-16 w-16 text-indigo-200 dark:text-indigo-900 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No Offers Yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You haven't received any placement offers yet. Continue applying to active drives to see updates here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => {
            const config = getStatusColorConfig(offer.status);
            return (
              <div
                key={offer.id}
                className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden ${config.cardBorder}`}
              >
                {/* Header banner gradient based on status */}
                <div className={`h-2.5 bg-gradient-to-r ${config.gradient}`} />

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top row: Company Name & Status */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                          {offer.company_name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                          {offer.drive_name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                        {offer.status}
                      </span>
                    </div>

                    {/* Role & Package */}
                    <div className="space-y-3.5 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Briefcase size={16} className="text-gray-400" />
                        <span className="font-semibold">{offer.designation}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                          {offer.package_ctc} LPA
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{offer.location}</span>
                      </div>
                    </div>

                    {/* Offer & Joining Dates */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/80 mb-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Offer Date</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-500" />
                          {offer.offer_date ? new Date(offer.offer_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Joining Date</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-500" />
                          {offer.joining_date ? new Date(offer.joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-2 mt-auto">
                    {/* Accept / Decline triggers for pending (Sent/Generated) offers */}
                    {(offer.status === "Sent" || offer.status === "Generated") && (
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <button
                          onClick={() => handleAccept(offer.id)}
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold shadow-sm transition-colors active:scale-95 duration-100"
                        >
                          <CheckCircle size={15} />
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOfferId(offer.id);
                            setIsDeclineModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 border border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 duration-100"
                        >
                          <XCircle size={15} />
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Policy Notice info for accepted offers */}
                    {offer.status === "Accepted" && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 mb-2">
                        <Info size={13} className="shrink-0" />
                        <span>Accepted. Enrolled in onboarding flow.</span>
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          await offerManagementService.downloadOfferLetter(offer.id, `Offer_Letter_${offer.company_name}`);
                          toast.success("Offer letter downloaded.");
                        } catch {
                          toast.error("Download failed.");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Download size={15} />
                      Download Letter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 dark:border-gray-700">
            <div className="bg-slate-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Decline Job Offer</h3>
              <button
                onClick={() => {
                  setIsDeclineModalOpen(false);
                  setDeclineReason("");
                  setSelectedOfferId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleDeclineSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Please share your reasons for declining this offer. This feedback will be submitted to the Placement Cell for official review.
              </p>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Decline Reason *</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Pursuing higher studies, accepted a higher CTC package off-campus, etc."
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-28 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeclineModalOpen(false);
                    setDeclineReason("");
                    setSelectedOfferId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecline}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg text-sm font-bold text-white shadow-md transition-all active:scale-95"
                >
                  {submittingDecline ? "Submitting..." : "Decline Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOffersPage;
