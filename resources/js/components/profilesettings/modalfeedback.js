import React, { useState } from 'react';
import ReactStars from 'react-rating-stars-component';
import '../../../sass/components/profilesettings/modalfeedback.scss';

const ModalFeedback = ({ onClose, onSubmit, workerName }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0 && feedback.trim()) {
      onSubmit({
        rating,
        feedback: feedback.trim(),
        workerName
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setRating(0);
    setFeedback('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Give Feedback</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="rating-section">
            <div className="stars-container">
              <ReactStars
                count={5}
                onChange={handleRatingChange}
                size={24}
                activeColor="#1d4ed8"
                color="#d1d5db"
                value={rating}
              />
            </div>
            <p className="rating-instruction">Click to rate</p>
          </div>

          <div className="feedback-section">
            <label htmlFor="feedback" className="feedback-label">
              Give Feedback
            </label>
            <textarea
              id="feedback"
              name="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with this worker..."
              className="feedback-textarea"
              rows={4}
              required
            />
          </div>

          <div className="modal-buttons">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={rating === 0 || !feedback.trim()}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalFeedback;
