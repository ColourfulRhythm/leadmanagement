# Adparlay Form Builder - Supabase Version

A modern, responsive form builder built with React, TypeScript, and Supabase for the backend.

## 🚀 Features

- **Modern Form Builder**: Intuitive drag-and-drop interface
- **Responsive Design**: Mobile-first approach with split media/form layout
- **Conditional Logic**: Show/hide questions based on user responses
- **Media Support**: Images, videos, and embedded content
- **Real-time Collaboration**: Built with Supabase for real-time updates
- **TypeScript**: Full type safety throughout the application
- **Vite**: Fast development and build times

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **State Management**: React Context + Supabase subscriptions

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd supabase-version
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

### 2. Run Database Migrations
```sql
-- Create forms table
CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create form_blocks table
CREATE TABLE form_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_questions table
CREATE TABLE form_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID REFERENCES form_blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  help_text TEXT,
  required BOOLEAN DEFAULT FALSE,
  options TEXT[],
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

## 🏗️ Project Structure

```
supabase-version/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── services/      # API and business logic
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── styles/        # CSS and styling
│   ├── lib/           # Third-party library configs
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── package.json       # Dependencies and scripts
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Development Workflow

1. **Create a new form**: Navigate to `/builder`
2. **Add blocks**: Use the "Add Block" button
3. **Add questions**: Configure question types and options
4. **Set conditional logic**: Add show/hide rules
5. **Preview**: Test your form at `/preview/:formId`
6. **Publish**: Make your form live at `/form/:formId`

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for theme changes
- Update `src/styles/index.css` for custom CSS
- Use the provided CSS classes for consistent styling

### Components
- All components are in `src/components/`
- Follow the existing component patterns
- Use TypeScript interfaces for props

## 📱 Responsive Design

The application is built with a mobile-first approach:
- **Mobile**: Media takes 40% of screen height, form below
- **Desktop**: Split screen with media left (50%), form right (50%)
- **Touch-friendly**: Optimized for mobile interactions

## 🔐 Authentication

- Built-in Supabase authentication
- Email/password login
- Protected routes for authenticated users
- User-specific form management

## 📊 Form Analytics

- Track form submissions
- User response analytics
- Real-time updates via Supabase subscriptions

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Manual Deployment
1. Run `npm run build`
2. Upload `dist` folder to your hosting provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ using modern web technologies**
