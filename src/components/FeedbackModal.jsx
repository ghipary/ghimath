import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { X, MessageSquareHeart, Send, CheckCircle, Lightbulb, Bug, Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'saran', label: 'Saran Fitur', icon: Lightbulb, color: 'from-amber-400 to-orange-500' },
  { value: 'bug', label: 'Laporkan Bug', icon: Bug, color: 'from-red-400 to-rose-500' },
  { value: 'pujian', label: 'Pujian', icon: Heart, color: 'from-pink-400 to-fuchsia-500' },
  { value: 'lainnya', label: 'Lainnya', icon: Star, color: 'from-teal-400 to-cyan-500' },
];

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState('saran');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Tulis pesan dulu ya!');
      return;
    }
    if (!user) {
      toast.error('Login dulu untuk kirim feedback!');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email?.split('@')[0] || 'Anonim',
        category,
        message: message.trim(),
        rating,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSent(true);
      toast.success('Feedback terkirim! Terima kasih! 🎉');
      setTimeout(() => {
        onClose();
        setSent(false);
        setMessage('');
        setCategory('saran');
        setRating(5);
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error('Gagal kirim: ' + err.message);
    }
    setSending(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={() => !sending && onClose()}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Refleksi & Saran</h2>
              <p className="text-[10px] text-white/80">Bantu kami jadi lebih baik! 💜</p>
            </div>
          </div>
          {!sending && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition">
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Terima Kasih! 🙏
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Feedbackmu sangat berarti untuk perkembangan GhiMath.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isActive
                          ? `border-transparent bg-gradient-to-r ${cat.color} text-white shadow-lg`
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Seberapa puas dengan GhiMath?
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Pesanmu
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ceritakan pengalamanmu, saran fitur, atau laporkan bug yang kamu temukan..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {message.length}/1000 karakter
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
            >
              {sending ? (
                <>Mengirim...</>
              ) : (
                <><Send className="w-4 h-4" /> Kirim Feedback</>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-400">
              Feedbackmu akan dibaca langsung oleh developer GhiMath 💜
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;