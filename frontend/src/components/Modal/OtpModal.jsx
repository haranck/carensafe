import { useState, useEffect, useRef } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVerifyOtp, useResendOtp } from "../../hooks/Auth/AuthHooks";
import { getErrorMessage } from "../../utils/errorMessage";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";

const OtpModal = ({ isOpen, onClose, email }) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();

    const { mutate: verifyMutate, isPending: isVerifying, error: verifyError } = useVerifyOtp();
    const { mutate: resendMutate, isPending: isResending, error: resendError, isSuccess: resendSuccess } = useResendOtp();

    useEffect(() => {
        let interval;
        if (isOpen && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    useEffect(() => {
        if (isOpen) {
            setOtp(["", "", "", "", "", ""]);
            setTimer(30);
            setCanResend(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 6) return;

        verifyMutate({ email, otp: otpValue }, {
            onSuccess: () => {
                onClose();
                // Verifying doesn't log in: on to login, keeping the gate's return path ({ from })
                navigate(FRONTEND_ROUTES.LOGIN, { state: location.state });
            }
        });
    };

    const handleResend = () => {
        resendMutate({ email }, {
            onSuccess: () => {
                setTimer(30);
                setCanResend(false);
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        });
    };

    if (!isOpen) return null;

    const errorMsg = verifyError ? getErrorMessage(verifyError, "Couldn't verify the code. Please try again.") : "";
    const resendErrorMsg = resendError ? getErrorMessage(resendError, "Couldn't resend the code. Please try again.") : "";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative transform transition-all">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-2"
                >
                    <X size={24} />
                </button>

                <div className="p-10 pt-12 flex flex-col items-center">
                    <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mb-5">
                        <ShieldCheck className="text-[#d6008a]" size={28} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-[#1e1a3a] mb-2 text-center">Verify Your Email</h3>
                    <p className="text-[13.5px] text-slate-500 text-center mb-8">
                        We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                    </p>

                    {errorMsg && (
                        <div className="w-full mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold text-center border border-rose-100">
                            {errorMsg}
                        </div>
                    )}
                    
                    {resendSuccess && !errorMsg && (
                        <div className="w-full mb-4 p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold text-center border border-emerald-100">
                            OTP resent successfully!
                        </div>
                    )}

                    {resendErrorMsg && !errorMsg && (
                         <div className="w-full mb-4 p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold text-center border border-rose-100">
                         {resendErrorMsg}
                     </div>
                    )}

                    <div className="flex gap-3 mb-8">
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                className="w-12 h-14 text-center text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#d6008a] focus:ring-1 focus:ring-[#d6008a] transition-all"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={otp.join("").length !== 6 || isVerifying}
                        className="w-full py-3.5 rounded-xl text-white text-[14.5px] font-bold tracking-wide
                        bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]
                        shadow-[0_4px_16px_rgba(214,0,138,0.30)]
                        hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(214,0,138,0.40)]
                        active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
                        transition-all duration-200 flex items-center justify-center"
                    >
                        {isVerifying ? (
                            <span className="w-[20px] h-[20px] border-[2.5px] border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        ) : (
                            "Verify OTP"
                        )}
                    </button>

                    <div className="mt-8 text-center text-[13px] font-medium text-slate-500">
                        {canResend ? (
                            <p>
                                Didn't receive code?{" "}
                                <button 
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="text-[#d6008a] font-bold hover:underline disabled:opacity-50"
                                >
                                    {isResending ? "Resending..." : "Resend OTP"}
                                </button>
                            </p>
                        ) : (
                            <p>
                                Resend code in <span className="text-[#d6008a] font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpModal;