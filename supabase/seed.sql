-- Idempotent seed. Run policies.sql first (adds courses.category).

insert into courses (id, slug, title, description, price, published, category) values
  ('c0000000-0000-0000-0000-000000000001', 'web-development-basics', 'Web Development Basics', 'Learn HTML, CSS, and JavaScript fundamentals.', 99, true, 'development'),
  ('c0000000-0000-0000-0000-000000000002', 'data-science-with-python', 'Data Science with Python', 'Python for data analysis and visualization.', 149, true, 'data'),
  ('c0000000-0000-0000-0000-000000000003', 'ux-design-principles', 'UX Design Principles', 'Create user-centered digital experiences.', 79, true, 'design')
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, description = excluded.description,
  price = excluded.price, published = excluded.published, category = excluded.category;

insert into modules (id, course_id, title, position) values
  ('d0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000001', 'HTML Fundamentals', 1),
  ('d0000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000001', 'CSS Styling', 2),
  ('d0000000-0000-0000-0000-000000000201', 'c0000000-0000-0000-0000-000000000002', 'Python Basics', 1),
  ('d0000000-0000-0000-0000-000000000202', 'c0000000-0000-0000-0000-000000000002', 'Data Analysis with Pandas', 2),
  ('d0000000-0000-0000-0000-000000000301', 'c0000000-0000-0000-0000-000000000003', 'UX Foundations', 1),
  ('d0000000-0000-0000-0000-000000000302', 'c0000000-0000-0000-0000-000000000003', 'Prototyping', 2)
on conflict (id) do update set
  course_id = excluded.course_id, title = excluded.title, position = excluded.position;

insert into lessons (id, module_id, title, content_md, is_free_preview, position) values
  ('e0000000-0000-0000-0000-000000010101', 'd0000000-0000-0000-0000-000000000101', 'Getting Started with HTML', 'Welcome! In this lesson you write your first HTML page.', true, 1),
  ('e0000000-0000-0000-0000-000000010102', 'd0000000-0000-0000-0000-000000000101', 'HTML Elements and Tags', 'Headings, paragraphs, links, lists and images.', false, 2),
  ('e0000000-0000-0000-0000-000000010201', 'd0000000-0000-0000-0000-000000000102', 'CSS Selectors', 'Target elements by tag, class, id and attribute.', false, 1),
  ('e0000000-0000-0000-0000-000000010202', 'd0000000-0000-0000-0000-000000000102', 'Flexbox Layout', 'Build one-dimensional layouts with flexbox.', false, 2),
  ('e0000000-0000-0000-0000-000000010203', 'd0000000-0000-0000-0000-000000000102', 'Responsive Design', 'Media queries and fluid layouts.', false, 3),
  ('e0000000-0000-0000-0000-000000020101', 'd0000000-0000-0000-0000-000000000201', 'Introduction to Python', 'Install Python and run your first script.', true, 1),
  ('e0000000-0000-0000-0000-000000020102', 'd0000000-0000-0000-0000-000000000201', 'Variables and Data Types', 'Numbers, strings, lists and dictionaries.', false, 2),
  ('e0000000-0000-0000-0000-000000020201', 'd0000000-0000-0000-0000-000000000202', 'Loading Data with Pandas', 'Read CSV files into DataFrames.', false, 1),
  ('e0000000-0000-0000-0000-000000020202', 'd0000000-0000-0000-0000-000000000202', 'Cleaning and Filtering', 'Handle missing values and filter rows.', false, 2),
  ('e0000000-0000-0000-0000-000000020203', 'd0000000-0000-0000-0000-000000000202', 'Visualizing Results', 'Plot your findings with matplotlib.', false, 3),
  ('e0000000-0000-0000-0000-000000030101', 'd0000000-0000-0000-0000-000000000301', 'What is UX?', 'Understand users, goals and context.', true, 1),
  ('e0000000-0000-0000-0000-000000030102', 'd0000000-0000-0000-0000-000000000301', 'User Research Basics', 'Interviews, surveys and personas.', false, 2),
  ('e0000000-0000-0000-0000-000000030201', 'd0000000-0000-0000-0000-000000000302', 'Wireframing', 'Sketch low-fidelity layouts quickly.', false, 1),
  ('e0000000-0000-0000-0000-000000030202', 'd0000000-0000-0000-0000-000000000302', 'Interactive Prototypes', 'Link screens into a clickable prototype.', false, 2)
on conflict (id) do update set
  module_id = excluded.module_id, title = excluded.title, content_md = excluded.content_md,
  is_free_preview = excluded.is_free_preview, position = excluded.position;
