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
      <a href={website} target="_blank" rel="noopener noreferrer" className="AboutCard">
        <div className="AboutCard__image">
          <img src={imageUrl} alt={`${name}`} />
        </div>
        <div className="AboutCard__info">
          <h3 className="AboutCard__name">{name}</h3>
          <p className="AboutCard__title">{title}</p>
          <p className="AboutCard__bio">{bio}</p>
        </div>
      </a>
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
      website: "https://cameron-plume.netlify.app/"
    },
    {
      name: "Nandini Ghosh",
      title: "Designer & Frontend Developer",
      imageUrl: "/images/nandini-ghosh.png",
      bio: "Nandini is a frontend developer and a UI/UX designer who loves bridging technology and human-centered design. President of NU Women in Tech, she loves cats, drinking tea and learning new recipes.",
      website: "https://www.nandinighosh.com/"
    },
    {
      name: "Alexander Angione",
      title: "Full Stack Developer",
      imageUrl: "/images/alexander-angione.jpg",
      bio: "Alex is an embedded, iOS, and full-stack software engineer with a desire to learn as much as possible. He's a former OOD/Fundies 2 TA and Oasis mentor, a basketball and volleyball enjoyer, and a cheese enthusiast",
      website: "https://github.com/alexangione419"
    },
    {
      name: "Sebastian Tremblay",
      title: "Infrastructure & Product Manager",
      imageUrl: "/images/sebastian-tremblay.png",
      bio: "Seby is an aspiring backend engineer interested in systems and large language models. He enjoys teaching, skating, and, of course, Panera.",
      website: "https://sebytremblay.com/"
    },
    {
      name: "Kenneth Chen",
      title: "Full Stack Developer",
      imageUrl: "/images/kenneth-chen.png",
      bio: "Kenny likes coding and code architecting. Founding president of Cooking Club, love art, cooking, and volleyball. Big braised ribs fan",
      website: "https://www.kenny.us/"
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
