import './styles.css';

interface AboutCardProps {
    name: string;
    title: string;
    imageUrl: string;
    bio: string;
    website: string;
  }
  
  const AboutCard: React.FC<AboutCardProps> = ({ name, title, imageUrl, bio, website }) => {
    return (
      <div className="AboutCard" onClick={() => window.open(website, '_blank')} style={{ cursor: 'pointer' }}>
        <div className="AboutCard__image">
          <img src={imageUrl} alt={`${name}`} />
        </div>
        <div className="AboutCard__info">
          <h3 className="AboutCard__name">{name}</h3>
          <p className="AboutCard__title">{title}</p>
          <p className="AboutCard__bio">{bio}</p>
        </div>
      </div>
    );
  };
  

const AboutUs: React.FC = () => {
  const team = [
    {
      name: "Nicholas Tietje",
      title: "Full Stack Developer",
      imageUrl: "/images/nick-tietje.jpg",
      bio: "Nick is passionate about creating intuitive and engaging web and mobile experiences. Former Database Design TA, Boardgame enjoyer, Kotlin connoisseur",
      website: "https://nicktietje.com"
    },
    {
      name: "Cameron Plume",
      title: "Backend Developer",
      imageUrl: "/images/cameron-plume.jpg",
      bio: "Former OOD TA, CS 1200 course author. Heavily involved with Generate Product Development. Golang advocate, Systems nerd, Ski bum. ",
      website: "https://github.com/CamPlume1"
    },
    {
      name: "Nandini Ghosh",
      title: "Designer & Frontend Developer",
      imageUrl: "/images/nandini-ghosh.png",
      bio: "Nandini is a talented designer and frontend developer with a keen eye for aesthetics and user experience.",
      website: "https://github.com/nandini-ghosh"
    },
    {
      name: "Alexander Angione",
      title: "Full Stack Developer",
      imageUrl: "/images/alexander-angione.jpg",
      bio: "Alex is a full stack developer with a passion for both frontend and backend development.",
      website: "https://github.com/alexangione419"
    },
    {
      name: "Sebastian Tremblay",
      title: "Infrastructure & Product Manager",
      imageUrl: "/images/sebastian-tremblay.png",
      bio: "Sebastian is responsible for infrastructure and product management, ensuring smooth operations and product development.",
      website: "https://github.com/sebytremblay"
    },
    {
      name: "Kenneth Chen",
      title: "Full Stack Developer",
      imageUrl: "/images/kenneth-chen.png",
      bio: "Kenny likes coding and code architecting. Founding president of Cooking Club, love art, cooking, and volleyball. Big braised ribs fan",
      website: "https://github.com/kennybc"
    }
  ];

  return (
    <div className="AboutUs">
      <div className="AboutUs__container">
        <h1 className="AboutUs__title">About GitMarks</h1>
        <h3 className="AboutUs__subtitle">{"\"Built by TAs, for TAs\""}</h3>
        <div className="AboutUs__description">
          <p>
            {"GitMarks is an innovative grading application designed to bridge the gap between academic programming assignments and industry practices. By leveraging GitHub's infrastructure, GitMarks creates a seamless experience for students to submit assignments through pull requests while allowing teaching assistants to provide detailed feedback through code reviews."}
          </p>
          <p>
            {"Our platform helps students familiarize themselves with industry-standard tools and workflows while making the grading process more efficient for course staff. With features like automated repository management, inline feedback, and comprehensive analytics, GitMarks transforms the way programming assignments are handled in academic settings."} 
          </p>
          <div className="AboutUs__features">
            <div className="AboutUs__feature">
              <h3>Industry-Aligned</h3>
              <p>{"Uses real-world development workflows with Git and GitHub"}</p>
            </div>
            <div className="AboutUs__feature">
              <h3>Seamless Experience</h3>
              <p>{"Streamlined submission and feedback process for students and TAs"}</p>
            </div>
            <div className="AboutUs__feature">
              <h3>Built for Scale</h3>
              <p>{"Designed to handle large course sizes with efficient grading workflows"}</p>
            </div>
            <div className="AboutUs__feature">
              <h3>In-Depth Analytics</h3>
              <p>{"Comprehensive analytics to track student progress and submission patterns"}</p>
            </div>
          </div>
          <a 
            href="https://github.com/NUSpecialProjects/gitmarks" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="AboutUs__github-button"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>

        <h2 className="AboutUs__title">Our Team</h2>
        <div className="AboutUs__grid">
          {team.map((member) => (
            <AboutCard
              key={member.name}
              name={member.name}
              title={member.title}
              imageUrl={member.imageUrl}
              bio={member.bio}
              website={member.website}
            />
          ))}
        </div>
        <div className="AboutUs__team-photo">
          <img src="/images/team-photo.jpg" alt="The GitMarks Team" />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
