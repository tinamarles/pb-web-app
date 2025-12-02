
import { Icon } from '@/app/ui';

const testimonials = [
  {
    quote: "This platform has completely transformed how our club manages leagues. Member communication is seamless, and enrollment has never been easier.",
    author: "Sarah Mitchell",
    role: "Director, Riverside Pickleball Club",
    rating: 5,
    initials: "SM",
    colorScheme: "primary" as const,
  },
  {
    quote: "I love being able to see all my league stats and schedules in one place. It's made it so much easier to stay organized across three different clubs.",
    author: "Mike Chen",
    role: "Competitive Player",
    rating: 5,
    initials: "MC",
    colorScheme: "secondary" as const,
  },
  {
    quote: "The notification system is a game-changer. We can instantly reach all our members with updates about court closures or schedule changes.",
    author: "Jennifer Davis",
    role: "Club Administrator",
    rating: 5,
    initials: "JD",
    colorScheme: "tertiary" as const,
  },
];

// Color class mappings for each testimonial
const getColorClasses = (scheme: "primary" | "secondary" | "tertiary") => {
  const colorMap = {
    primary: {
      avatarBg: "bg-primary",
      avatarText: "text-on-primary",
      border: "border-l-primary",
      quoteBg: "text-primary/5",
    },
    secondary: {
      avatarBg: "bg-secondary",
      avatarText: "text-on-secondary",
      border: "border-l-secondary",
      quoteBg: "text-secondary/5",
    },
    tertiary: {
      avatarBg: "bg-tertiary",
      avatarText: "text-on-tertiary",
      border: "border-l-tertiary",
      quoteBg: "text-tertiary/5",
    },
  };
  return colorMap[scheme];
};

function TestimonialCard({ 
  quote, 
  author, 
  role,
  rating,
  initials,
  colorScheme,
}: { 
  quote: string; 
  author: string; 
  role: string;
  rating: number;
  initials: string;
  colorScheme: "primary" | "secondary" | "tertiary";
}) {
  const colors = getColorClasses(colorScheme);
  
  return (
    <div className={`group relative flex flex-col gap-lg p-xl 
                     bg-surface-container-low rounded-2xl
                     border-l-4 ${colors.border} border border-outline-variant
                     shadow-sm
                     transition-all duration-300
                     hover:shadow-elevation-md hover:-translate-y-2`}>
      
      <div className="flex justify-between items-start">
        {/* Quote Icon */}
        <Icon name="quote" className="icon-lg text-primary/80" />
                
        {/* Star Rating */}
        <div className="flex gap-xs" aria-label={`${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <Icon name="default"
            key={i}
            className={`w-5 h-5 ${i < rating ? 'fill-primary text-primary' : 'text-outline'}`}
          />
        ))}
        </div>
      </div>
     
      {/* Quote */}
      <p className="body-lg text-on-surface relative z-10 leading-relaxed">
        &quot{quote}&quot
      </p>
      
      {/* Author Section */}
      <div className="flex items-center gap-md pt-md">
        {/* Avatar Circle with Initials */}
        <div className={`w-12 h-12 rounded-full ${colors.avatarBg} ${colors.avatarText} 
                        flex items-center justify-center flex-shrink-0
                        shadow-sm
                        group-hover:scale-110 transition-transform duration-300`}>
          <span className="label-lg">{initials}</span>
        </div>
        
        {/* Author Info */}
        <div className="flex flex-col gap-xs">
          <div className="title-md text-on-surface">{author}</div>
          <div className="body-sm text-on-surface-variant">{role}</div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-surface py-section-mobile lg:py-section-desktop">
      <div className="max-w-7xl mx-auto p-card
                      sm:p-section-mobile  
                      lg:p-section-desktop">
        <div className="flex flex-col gap-4xl">
          {/* Section Header */}
          <div className="flex flex-col gap-md text-center max-w-2xl mx-auto">
            <h2 className="headline-lg text-on-surface
                           lg:display-sm">What Our Community Says</h2>
            <p className="subheading-lg text-on-surface-variant">
              Trusted by players and clubs across the country
            </p>
          </div>

          {/* Testimonials Grid with Staggered Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl items-start">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className={`${index === 1 ? 'md:mt-2xl' : ''} ${index === 2 ? 'md:mt-4xl' : ''}`}
              >
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}