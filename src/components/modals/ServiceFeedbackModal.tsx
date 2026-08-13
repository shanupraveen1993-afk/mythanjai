"use client";

import React, { useState } from "react";
import { Check, Star, AlertCircle, PhoneOff, ThumbsDown, ShieldAlert, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/context/ToastContext";

interface ServiceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string;
  serviceName?: string;
  phone?: string;
}

export default function ServiceFeedbackModal({
  isOpen,
  onClose,
  serviceId,
  serviceName = "this Tradesman",
  phone,
}: ServiceFeedbackModalProps) {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<"satisfied" | "unanswered" | "unsatisfied" | null>(null);
  const [rating, setRating] = useState(5);
  const [issueDescription, setIssueDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = async () => {
    if (selectedOption === "unsatisfied" && !issueDescription.trim()) {
      toast.error("Please describe the issue or experience briefly.");
      return;
    }

    setLoading(true);

    try {
      if (serviceId && !serviceId.startsWith("sv_")) {
        const serviceRef = doc(db, "services", serviceId);
        if (selectedOption === "unsatisfied") {
          await updateDoc(serviceRef, {
            negative_reports_count: increment(1),
          });
        }
      }
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedOption(null);
      }, 1200);
    } catch (err) {
      console.warn("Feedback submission notice:", err);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedOption(null);
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 font-sans relative animate-scale-up">
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">Feedback Received!</h3>
            <p className="text-xs text-slate-500 font-medium">Thank you for helping maintain community quality.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Header Title */}
            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Service Experience Check
              </span>
              <h3 className="font-heading font-black text-base text-slate-900 leading-snug">
                How was the experience with {serviceName}?
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Phone: +91 {phone}
              </p>
            </div>

            {/* Options Selector */}
            <div className="flex flex-col gap-2 my-1">
              
              {/* Option 1: Answered & Service Confirmed */}
              <button
                type="button"
                onClick={() => setSelectedOption("satisfied")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  selectedOption === "satisfied"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-xs">Answered & Service Confirmed</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Responded, verified work & pricing</p>
                </div>
              </button>

              {/* Option 2: Not Answered */}
              <button
                type="button"
                onClick={() => setSelectedOption("unanswered")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  selectedOption === "unanswered"
                    ? "bg-amber-50 border-amber-500 text-amber-950 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <PhoneOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs">Not Answered</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Line busy or no response</p>
                </div>
              </button>

              {/* Option 3: Report Issue */}
              <button
                type="button"
                onClick={() => setSelectedOption("unsatisfied")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  selectedOption === "unsatisfied"
                    ? "bg-red-50 border-red-500 text-red-950 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                  <ThumbsDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs">Report Issue</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Incorrect details or misconduct</p>
                </div>
              </button>

            </div>

            {/* Additional Fields based on option */}
            {selectedOption === "satisfied" && (
              <div className="flex flex-col items-center gap-1.5 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="text-xs font-black text-emerald-900">Rate Service Quality:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedOption === "unsatisfied" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-red-900">
                  Describe Issue (Required):
                </label>
                <textarea
                  rows={2}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe why you were not satisfied..."
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            )}

            {/* Actions: Submit or Ask Later */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                disabled={loading || !selectedOption}
                onClick={handleSubmitFeedback}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Verification</span>}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-800 font-extrabold text-xs text-center cursor-pointer transition-colors"
              >
                Ask Later
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
