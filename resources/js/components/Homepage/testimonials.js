import React from 'react';
import './../../../sass/components/HomepageStyles/testimonials.scss';
import { IconStarFilled } from '@tabler/icons-react';

const Testimonials = () => {
  return (
    <section className="testimonials">
      <h2 className="testimonials__title">
        See What Happy Users Are Saying About NextUse
      </h2>
      <div className="testimonials__grid">
        <div className="testimonials__item">
          <div className="testimonials__header">
            <h3>Kean P.</h3>
            <div className="testimonials__stars">
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
            </div>
          </div>
          <p>
            I sold my old bookshelf on NextUse in just 2 days! The listing process was super easy, and the buyer was so friendly. I love that I could declutter my home and make some extra cash while helping someone else.
          </p>
        </div>

        <div className="testimonials__item">
          <div className="testimonials__header">
            <h3>Gael M.</h3>
            <div className="testimonials__stars">
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
            </div>
          </div>
          <p>
            I sold my old bookshelf on NextUse in just 2 days! The listing process was super easy, and the buyer was so friendly. I love that I could declutter my home and make some extra cash while helping someone else.
          </p>
        </div>

        <div className="testimonials__item">
          <div className="testimonials__header">
            <h3>Moctar F.</h3>
            <div className="testimonials__stars">
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
              <IconStarFilled size={16} />
            </div>
          </div>
          <p>
            I sold my old bookshelf on NextUse in just 2 days! The listing process was super easy, and the buyer was so friendly. I love that I could declutter my home and make some extra cash while helping someone else.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;