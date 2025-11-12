import React, { useState } from 'react';
import Headerz from './Headerz';
import Footer from '../FooterContent/footer';

const AboutUs = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I create an account?",
            answer: "You can create an account by clicking on the 'Sign Up' button in the header. Choose whether you're a worker or an employer, fill in your details, and verify your email address to get started."
        },
        {
            question: "How do I find workers for my project?",
            answer: "As an employer, you can browse worker profiles, post job listings, or search for workers based on skills and experience. Once you find a suitable candidate, you can send them a message or make a booking request."
        },
        {
            question: "How do I apply for jobs?",
            answer: "As a worker, you can browse available job postings, filter by your skills and preferences, and apply directly to jobs that match your profile. You can also receive booking requests from employers."
        },
        {
            question: "How does the payment system work?",
            answer: "Payments are processed securely through our platform. Employers can make payments after work completion, and workers receive payments according to the agreed terms. All transactions are protected and tracked."
        },
        {
            question: "Can I edit my profile after creating it?",
            answer: "Yes, you can edit your profile at any time by going to your profile settings. You can update your skills, credentials, work preferences, and personal information."
        },
        {
            question: "What if I have a dispute with a worker or employer?",
            answer: "We have a dispute resolution system in place. You can contact our support team, and we'll help mediate any issues. We also have a review and rating system to ensure transparency."
        },
        {
            question: "Is my personal information secure?",
            answer: "Yes, we take data security seriously. Your personal information is encrypted and stored securely. We only share necessary information between workers and employers for job matching purposes, and we never sell your data to third parties."
        },
        {
            question: "How do I delete my account?",
            answer: "You can delete your account by going to your profile settings and selecting the account deletion option. Please note that this action is permanent and cannot be undone."
        }
    ];

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

                    {/* Privacy Policy Section */}
                    <div className="about-us__section privacy-policy">
                        <h2 className="section-title">Privacy Policy</h2>
                        <div className="privacy-policy__content">
                            <div className="privacy-section">
                                <h3>Information We Collect</h3>
                                <p>
                                    We collect information that you provide directly to us, including your name, 
                                    email address, contact information, skills, work experience, and credentials. 
                                    We also collect information about your use of our platform, including job 
                                    applications, bookings, and interactions with other users.
                                </p>
                            </div>
                            <div className="privacy-section">
                                <h3>How We Use Your Information</h3>
                                <p>
                                    We use your information to provide, maintain, and improve our services, 
                                    including matching workers with employers, processing payments, and 
                                    communicating with you about your account and our services. We also use 
                                    your information to ensure platform security and prevent fraud.
                                </p>
                            </div>
                            <div className="privacy-section">
                                <h3>Information Sharing</h3>
                                <p>
                                    We share your information with other users on the platform as necessary 
                                    for job matching and communication. We do not sell your personal information 
                                    to third parties. We may share information with service providers who 
                                    assist us in operating our platform, subject to strict confidentiality agreements.
                                </p>
                            </div>
                            <div className="privacy-section">
                                <h3>Data Security</h3>
                                <p>
                                    We implement appropriate technical and organizational measures to protect 
                                    your personal information against unauthorized access, alteration, disclosure, 
                                    or destruction. However, no method of transmission over the Internet is 
                                    100% secure, and we cannot guarantee absolute security.
                                </p>
                            </div>
                            <div className="privacy-section">
                                <h3>Your Rights</h3>
                                <p>
                                    You have the right to access, update, or delete your personal information 
                                    at any time through your account settings. You can also opt out of certain 
                                    communications from us. If you have questions about your privacy rights, 
                                    please contact our support team.
                                </p>
                            </div>
                            <div className="privacy-section">
                                <h3>Changes to This Policy</h3>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you 
                                    of any changes by posting the new Privacy Policy on this page and updating 
                                    the "Last Updated" date. You are advised to review this Privacy Policy 
                                    periodically for any changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQs Section */}
                    <div className="about-us__section faqs">
                        <h2 className="section-title">Frequently Asked Questions</h2>
                        <div className="faqs__content">
                            {faqs.map((faq, index) => (
                                <div 
                                    key={index} 
                                    className={`faq-item ${openFaq === index ? 'active' : ''}`}
                                >
                                    <button 
                                        className="faq-question"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={openFaq === index}
                                    >
                                        <span>{faq.question}</span>
                                        <svg 
                                            className="faq-icon" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        >
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AboutUs;
