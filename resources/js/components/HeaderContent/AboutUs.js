import React from 'react';
import Headerz from './Headerz';
import Footer from '../FooterContent/footer';

const AboutUs = () => {
    return (
        <>
            <Headerz />
            <div className="about-us">
                <div className="about-us__container">
                    <div className="about-us__content">
                        <h1 className="about-us__title">About Us</h1>
                        <div className="about-us__description">
                            <p>
                                Welcome to our platform where we connect talented professionals 
                                with amazing opportunities. We believe in creating meaningful 
                                connections that drive success for both employers and workers.
                            </p>
                            <p>
                                Our mission is to provide a seamless, efficient, and user-friendly 
                                experience for job seekers and employers alike. We're committed to 
                                building a community where talent meets opportunity.
                            </p>
                        </div>
                        <div className="about-us__features">
                            <div className="feature">
                                <h3>For Workers</h3>
                                <p>Find the perfect job that matches your skills and aspirations</p>
                            </div>
                            <div className="feature">
                                <h3>For Employers</h3>
                                <p>Connect with qualified professionals to grow your business</p>
                            </div>
                            <div className="feature">
                                <h3>Quality Service</h3>
                                <p>Dedicated support and reliable platform for all your needs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AboutUs;
