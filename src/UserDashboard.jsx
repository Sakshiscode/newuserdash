import React, { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';

// ============================================================================
// POLYFILL: Mock window.storage for environments lacking a custom storage API
// NOTE: In a real app, this would be an actual API or a Node.js endpoint call.
// This is done to prevent the code from crashing when window.storage is undefined.
// ============================================================================
if (typeof window.storage === 'undefined') {
    window.storage = {
        // This function simulates saving data to a local DB/file structure
        set: async (key, value, shouldLog) => {
            if (shouldLog) {
                console.log(`[STORAGE MOCK] Storing data under key: ${key}`);
                console.log("Data saved (simulated):", JSON.parse(value));
            }
            // In a Python/Node.js backend, THIS is where the fetch() call 
            // to a server endpoint would trigger saving the CSV/JSON file.
            return Promise.resolve(true);
        }
    };
}


export default function UserDashboard() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const GEMINI_API_KEY = "AIzaSyDEuzSUl2PUYHjPcEB5qJQpMZEuy4FNvvI"; // WARNING: Replace this placeholder key

  const generateAIResponse = async (rating, review) => {
    // Prompt structure ensures the AI returns a concise customer service response.
    const promptText = `
You are a customer service AI. A user has submitted feedback with a ${rating}-star rating and the following review: "${review}". 

Generate a personalized, empathetic response that:
1. Thanks them for their feedback
2. Addresses their specific concerns or praise
3. Is warm and professional
4. Keeps the response concise (2-3 sentences)

Respond directly without any preamble.
`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        // AI-generated response returned
        return data.candidates[0].content.parts[0].text;
      }
      
      // Fallback if API fails to provide a candidate
      return "Thank you for your detailed feedback! We appreciate you taking the time to share your experience with us.";
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback response for network/API key error
      return "Thank you for your feedback. We appreciate your time.";
    }
  };

  const handleSubmit = async () => {
  if (rating === 0 || !review.trim()) {
    alert('Please provide both a rating and review');
    return;
  }

  setLoading(true);
  setAiResponse('');

  try {
    // Send only rating + review
    const response = await fetch("http://localhost:5000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, review }),
    });

    const result = await response.json();

    // ✅ Use backend’s AI response
    setAiResponse(result.aiResponse);
    setSubmitted(true);
  } catch (error) {
    console.error('Submission error:', error);
    alert('Failed to submit feedback. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setRating(0);
    setReview('');
    setAiResponse('');
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-2xl w-full px-4 py-12 text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Share Your Feedback
          </h1>
          <p className="text-gray-600">
            We value your opinion and want to hear about your experience
          </p>
          
        </div>

        {!submitted ? (
          /* Feedback Input */
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Star Rating */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                How would you rate your experience?
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={48}
                      className={`${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-3 text-gray-600">
                  You rated: {rating} {rating === 1 ? 'star' : 'stars'}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Tell us more about your experience
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your thoughts, suggestions, or concerns..."
                // FIX: Removed mx-auto w-3/4 to let w-full handle text area width
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-left"
                rows={6}
                disabled={loading}
              />
            </div>

            


            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0 || !review.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        ) : (
          /* Success Response */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You for Your Feedback!
              </h2>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
              
              <p className="text-gray-800 leading-relaxed">
                {aiResponse}
              </p>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Submit Another Review
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Your feedback helps us improve our service</p>
        </div>
      </div>
    </div>
  );
}