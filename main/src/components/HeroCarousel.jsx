import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import '../styles/HeroCarousel.css';

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await contentAPI.getActiveCarouselItems();
      if (error) {
        console.error("Failed to load carousel slides:", error);
      } else {
        setSlides(data || []);
      }
      setLoading(false);
    };

    fetchSlides();
  }, []);

  if (loading) {
    return <div className="hero-carousel-skeleton"></div>;
  }

  if (!slides.length) {
    return null; // Don't render anything if there are no slides
  }

  return (
    <div className="hero-carousel-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="slide-content">
              <img src={slide.image_url} alt={slide.title} className="slide-image" />
              <div className="slide-overlay">
                <div className="slide-text">
                  <h2 className="slide-title">{slide.title}</h2>
                  {slide.description && <p className="slide-description">{slide.description}</p>}
                  {slide.link_url && (
                    <Link to={slide.link_url} className="slide-cta-button">
                      Xem chi tiết
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroCarousel;
