<?php

     namespace Database\Seeders;

     use Illuminate\Database\Seeder;
     use Illuminate\Support\Facades\DB;

     class SkillSeeder extends Seeder
     {
         public function run(): void
         {
             $skills = [
                 // Common job skills in Butuan with sub-skills
                 [
                     'skill_name' => 'Plumbing',
                     'sub_skills' => [
                         'Pipe Installation',
                         'Leak Repair',
                         'Drain Cleaning',
                         'Faucet Installation',
                         'Toilet Repair',
                         'Water Heater Installation',
                         'Pipe Welding',
                         'Bathroom Remodeling',
                         'Kitchen Plumbing',
                         'Emergency Repairs'
                     ]
                 ],
                 [
                     'skill_name' => 'Electrical Work',
                     'sub_skills' => [
                         'Wiring Installation',
                         'Outlet Installation',
                         'Switch Installation',
                         'Circuit Breaker Repair',
                         'Light Fixture Installation',
                         'Electrical Panel Upgrade',
                         'GFCI Installation',
                         'Ceiling Fan Installation',
                         'Security System Wiring',
                         'Generator Installation'
                     ]
                 ],
                 [
                     'skill_name' => 'Carpentry',
                     'sub_skills' => [
                         'Furniture Building',
                         'Cabinet Making',
                         'Door Installation',
                         'Window Installation',
                         'Flooring Installation',
                         'Trim Work',
                         'Deck Building',
                         'Fence Construction',
                         'Custom Shelving',
                         'Wood Repair'
                     ]
                 ],
                 [
                     'skill_name' => 'Welding',
                     'sub_skills' => [
                         'MIG Welding',
                         'TIG Welding',
                         'Arc Welding',
                         'Stick Welding',
                         'Aluminum Welding',
                         'Stainless Steel Welding',
                         'Pipe Welding',
                         'Structural Welding',
                         'Automotive Welding',
                         'Fabrication'
                     ]
                 ],
                 [
                     'skill_name' => 'Computer / IT Skills',
                     'sub_skills' => [
                         'Hardware Repair',
                         'Software Installation',
                         'Network Setup',
                         'Data Recovery',
                         'Virus Removal',
                         'System Optimization',
                         'Printer Setup',
                         'Email Configuration',
                         'Backup Solutions',
                         'Troubleshooting'
                     ]
                 ],
                 [
                     'skill_name' => 'Driving',
                     'sub_skills' => [
                         'Personal Vehicle',
                         'Commercial Vehicle',
                         'Motorcycle',
                         'Truck Driving',
                         'Bus Driving',
                         'Taxi Service',
                         'Delivery Driving',
                         'Chauffeur Service',
                         'Emergency Vehicle',
                         'Heavy Equipment'
                     ]
                 ],
                 [
                     'skill_name' => 'Cooking',
                     'sub_skills' => [
                         'Home Cooking',
                         'Restaurant Cooking',
                         'Baking',
                         'Pastry Making',
                         'Grilling',
                         'Catering',
                         'Meal Planning',
                         'Food Preparation',
                         'Kitchen Management',
                         'Menu Development'
                     ]
                 ],
                 [
                     'skill_name' => 'Sewing',
                     'sub_skills' => [
                         'Clothing Alteration',
                         'Dress Making',
                         'Tailoring',
                         'Embroidery',
                         'Quilting',
                         'Upholstery',
                         'Costume Making',
                         'Bag Making',
                         'Home Decor Sewing',
                         'Repair Work'
                     ]
                 ],
                 [
                     'skill_name' => 'Machine Operation',
                     'sub_skills' => [
                         'Heavy Machinery',
                         'CNC Machines',
                         'Forklift Operation',
                         'Crane Operation',
                         'Excavator Operation',
                         'Manufacturing Equipment',
                         'Packaging Machines',
                         'Printing Press',
                         'Conveyor Systems',
                         'Safety Protocols'
                     ]
                 ],
                 [
                     'skill_name' => 'Housekeeping',
                     'sub_skills' => [
                         'Residential Cleaning',
                         'Commercial Cleaning',
                         'Deep Cleaning',
                         'Window Cleaning',
                         'Carpet Cleaning',
                         'Laundry Service',
                         'Organization',
                         'Sanitization',
                         'Maintenance',
                         'Eco-Friendly Cleaning'
                     ]
                 ],
                 [
                     'skill_name' => 'Gardening / Landscaping',
                     'sub_skills' => [
                         'Plant Care',
                         'Lawn Maintenance',
                         'Tree Trimming',
                         'Garden Design',
                         'Irrigation Systems',
                         'Pest Control',
                         'Fertilizing',
                         'Pruning',
                         'Landscape Installation',
                         'Seasonal Cleanup'
                     ]
                 ],
                 [
                     'skill_name' => 'Painting',
                     'sub_skills' => [
                         'Interior Painting',
                         'Exterior Painting',
                         'Wall Preparation',
                         'Color Matching',
                         'Priming',
                         'Touch-up Work',
                         'Decorative Painting',
                         'Stain Application',
                         'Varnish Work',
                         'Safety Procedures'
                     ]
                 ],
                 [
                     'skill_name' => 'Cleaning Services',
                     'sub_skills' => [
                         'Office Cleaning',
                         'House Cleaning',
                         'Window Cleaning',
                         'Carpet Cleaning',
                         'Deep Cleaning',
                         'Post-Construction Cleanup',
                         'Event Cleanup',
                         'Sanitization',
                         'Eco-Friendly Cleaning',
                         'Maintenance Cleaning'
                     ]
                 ],
                 [
                     'skill_name' => 'Delivery Services',
                     'sub_skills' => [
                         'Food Delivery',
                         'Package Delivery',
                         'Document Delivery',
                         'Grocery Delivery',
                         'Pharmacy Delivery',
                         'Express Delivery',
                         'Bulk Delivery',
                         'Scheduled Delivery',
                         'Same-Day Delivery',
                         'Cross-City Delivery'
                     ]
                 ],
                 [
                     'skill_name' => 'Security Services',
                     'sub_skills' => [
                         'Building Security',
                         'Event Security',
                         'Retail Security',
                         'Residential Security',
                         'Crowd Control',
                         'Patrol Services',
                         'Access Control',
                         'Emergency Response',
                         'Surveillance',
                         'Safety Protocols'
                     ]
                 ],
                 [
                     'skill_name' => 'Maintenance Work',
                     'sub_skills' => [
                         'Building Maintenance',
                         'Equipment Repair',
                         'Preventive Maintenance',
                         'HVAC Maintenance',
                         'Plumbing Maintenance',
                         'Electrical Maintenance',
                         'Carpentry Repairs',
                         'Painting Touch-ups',
                         'Cleaning Services',
                         'Safety Inspections'
                     ]
                 ],
                 [
                     'skill_name' => 'Sales',
                     'sub_skills' => [
                         'Retail Sales',
                         'Door-to-Door Sales',
                         'Phone Sales',
                         'Customer Service',
                         'Product Knowledge',
                         'Negotiation',
                         'Lead Generation',
                         'Follow-up Sales',
                         'Relationship Building',
                         'Sales Reporting'
                     ]
                 ],
                 [
                     'skill_name' => 'Administrative Work',
                     'sub_skills' => [
                 'Data Entry',
                         'Filing',
                         'Phone Handling',
                         'Email Management',
                         'Scheduling',
                         'Record Keeping',
                 'Customer Service',
                         'Office Organization',
                         'Document Preparation',
                         'Basic Accounting'
                     ]
                 ],
                 [
                     'skill_name' => 'Teaching / Tutoring',
                     'sub_skills' => [
                         'Elementary Teaching',
                         'High School Teaching',
                         'Math Tutoring',
                         'English Tutoring',
                         'Science Tutoring',
                         'Computer Skills',
                         'Language Teaching',
                         'Test Preparation',
                         'Special Needs Education',
                         'Online Teaching'
                     ]
                 ],
                 [
                     'skill_name' => 'Healthcare Support',
                     'sub_skills' => [
                         'Caregiving',
                         'Nursing Assistant',
                         'Medical Records',
                         'Patient Care',
                         'Medication Assistance',
                         'Physical Therapy Aid',
                         'Health Education',
                         'Emergency Response',
                         'Medical Equipment',
                         'Health Monitoring'
                     ]
                 ]
             ];

             DB::table('skills')->truncate(); // Clear existing data

            foreach ($skills as $skill) {
                if (is_array($skill) && isset($skill['skill_name'])) {
                    // New format with sub_skills - store as JSON string if column exists, otherwise just skill_name
                    $insertData = [
                        'skill_name' => $skill['skill_name'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Only add sub_skills if column exists in database
                    // For now, we'll just store the skill_name
                    DB::table('skills')->insert($insertData);
                } else {
                    // Old format (string only)
                    DB::table('skills')->insert([
                        'skill_name' => $skill,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
         }
     }