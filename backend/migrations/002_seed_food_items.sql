-- Seed Indian food items
INSERT INTO food_items (name, name_local, country_code, region, category, serving_unit, serving_size_g, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, cooking_notes, verified) VALUES
('Roti (plain, wheat)', 'रोटी', 'IN', 'Pan India', 'roti', 'piece', 30, 80, 2.7, 15.5, 0.9, 1.9, 'No ghee assumed', true),
('Roti with ghee', 'घी रोटी', 'IN', 'Pan India', 'roti', 'piece', 32, 110, 2.7, 15.5, 3.5, 1.9, '0.5 tsp ghee applied', true),
('Chapati (thin)', 'चपाती', 'IN', 'Pan India', 'roti', 'piece', 25, 65, 2.0, 13.0, 0.5, 1.5, 'Thin rolled, no ghee', true),
('Paratha (plain)', 'पराठा', 'IN', 'North India', 'roti', 'piece', 80, 200, 4.0, 25.0, 9.0, 2.0, '1 tsp ghee used for cooking', true),
('Aloo Paratha', 'आलू पराठा', 'IN', 'North India', 'roti', 'piece', 130, 280, 5.0, 40.0, 11.0, 2.5, 'Potato stuffed, cooked with 1 tsp ghee', true),
('Dal (toor/arhar)', 'तूर दाल', 'IN', 'Pan India', 'dal', 'bowl', 200, 150, 9.0, 24.0, 5.5, 3.0, 'Includes ghee tadka with cumin and garlic', true),
('Dal Makhani', 'दाल मखनी', 'IN', 'North India', 'dal', 'bowl', 200, 230, 9.0, 22.0, 12.0, 4.0, 'Black dal with butter and cream', true),
('Paneer (cubed, in curry)', 'पनीर', 'IN', 'Pan India', 'dairy', 'g', 100, 265, 18.0, 1.2, 20.0, 0.0, 'Full-fat paneer, cubed', true),
('Paneer Bhurji', 'पनीर भुर्जी', 'IN', 'Pan India', 'vegetable', 'bowl', 200, 320, 20.0, 8.0, 24.0, 1.5, 'Scrambled paneer with onion, tomato, 1 tbsp oil', true),
('Bhindi Masala (dry)', 'भिंडी मसाला', 'IN', 'Pan India', 'vegetable', 'bowl', 150, 95, 2.5, 10.0, 5.0, 3.0, '1 tsp oil, onion, tomato base', true),
('Aloo Sabzi', 'आलू सब्ज़ी', 'IN', 'Pan India', 'vegetable', 'bowl', 200, 140, 3.0, 23.0, 4.5, 2.5, 'Potato curry with 1 tsp oil, onion, tomato', true),
('Palak Paneer', 'पालक पनीर', 'IN', 'North India', 'vegetable', 'bowl', 200, 220, 13.0, 8.0, 16.0, 2.0, 'Spinach with paneer cubes, cream, ghee', true),
('Chicken Curry', 'चिकन करी', 'IN', 'Pan India', 'meat', 'bowl', 200, 250, 25.0, 6.0, 14.0, 1.0, 'Bone-in chicken, onion-tomato gravy, 1 tbsp oil', true),
('Dal Chawal (combo)', 'दाल चावल', 'IN', 'Pan India', 'dal', 'plate', 350, 345, 13.0, 60.0, 5.0, 4.0, 'Dal 200ml + steamed rice 150g', true),
('Curd / Dahi (full fat)', 'दही', 'IN', 'Pan India', 'dairy', 'ml', 100, 60, 3.2, 4.7, 3.2, 0.0, 'Full-fat homemade curd, per 100ml', true),
('Steamed Rice', 'चावल', 'IN', 'Pan India', 'rice', 'bowl', 150, 195, 4.0, 43.0, 0.4, 0.5, 'Plain white rice, cooked, medium bowl', true),
('Jeera Rice', 'जीरा राइस', 'IN', 'Pan India', 'rice', 'bowl', 150, 230, 4.0, 44.0, 5.0, 0.8, '1 tsp ghee + cumin seeds', true),
('Samosa (medium)', 'समोसा', 'IN', 'Pan India', 'snack', 'piece', 80, 155, 3.0, 18.0, 8.0, 1.5, 'Potato stuffed, deep fried', true),
('Idli (plain)', 'इडली', 'IN', 'South India', 'snack', 'piece', 40, 39, 2.0, 8.0, 0.2, 0.5, 'Steamed rice-urad batter', true),
('Dosa (plain)', 'दोसा', 'IN', 'South India', 'snack', 'piece', 100, 133, 4.0, 25.0, 2.5, 1.0, 'Medium size, minimal oil on tawa', true)
ON CONFLICT DO NOTHING;
