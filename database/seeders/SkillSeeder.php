<?php

     namespace Database\Seeders;

     use Illuminate\Database\Seeder;
     use Illuminate\Support\Facades\DB;

     class SkillSeeder extends Seeder
     {
         public function run(): void
         {
             $skills = [
                 'Virtual Assistant',
                 'Wordpress Developer',
                 'SEO',
                 'Graphic Designer',
                 'Social Media Marketer',
                 'PHP Developer',
                 'Real Estate Virtual Assistant',
                 'Content Writer',
                 'Amazon Expert',
                 'Sales Representative',
                 'Marketing Specialist',
                 'Shopify Developer',
                 'Video Editor',
                 'Data Entry',
                 'Web Developer',
                 'Project Manager',
                 'GoHighLevel',
                 'Facebook Ads Manager',
                 'Lead Generation',
                 'Email Marketer',
                 'eBay Virtual Assistant',
                 'Customer Service',
                 'Google Ads Manager',
                 'Magento Developer',
                 'Web Designer',
                 'Copywriter',
                 'QuickBooks',
                 'PPC',
                 'Ecommerce Researcher',
                 'Accountant',
                 'iOS Developer',
                 'Photoshop',
                 'Logo Design',
                 'Shirt Design',
                 'Print Design',
                 'Quality Assurance',
                 'Software QA Testing',
                 'Event Planner',
                 'Research',
                 'Travel Planning',
                 'Bookkeeping',
                 'Business Plans',
                 'Excel',
                 'Admin Assistant',
                 'Email Management',
                 'Blogging',
                 'Creative Writing',
                 'Appointment Setter',
                 'Translation',
                 'Tutoring Teaching',
                 'Architectural and Engineering Services',
                 'Design Project Management',
                 'Web Content Writing',
                 'Community Moderation',
                 'AI Tools',
                 'JSON',
                 'CAD/CAM',
                 'CRM',
                 'Cold Calling',
                 'Financial Accounting',
                 'Forecasting',
                 'Meta Business Suite',
                 'Amazon Ads',
                 'Performance Marketing',
                 'Content Creation',
                 'Product Sourcing',
                 'Adobe Premiere Pro',
                 'Clickfunnels',
                 'Kajabi',
                 'Active Campaign',
                 'Node JS',
                 'REST API',
                 'Outbound Sales',
                 'Sales Support',
                 'Local SEO',
                 'On-Page Backlinks',
                 'Google Data Studio',
                 'Notion Database Management',
                 'Web Design & Page Layout',
                 'Clickup',
                 'Power BI',
                 'PowerApps',
                 'Integration',
                 'Make.com'
             ];

             DB::table('skills')->truncate(); // Clear existing data

             foreach ($skills as $skill) {
                 DB::table('skills')->insert([
                     'skill_name' => $skill,
                     'archived' => false,
                     'created_at' => now(),
                     'updated_at' => now(),
                 ]);
             }
         }
     }