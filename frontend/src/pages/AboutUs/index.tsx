import './styles.css';

interface AboutCardProps {
    name: string;
    title: string;
    imageUrl: string;
    bio: string;
  }
  
  const AboutCard: React.FC<AboutCardProps> = ({ name, title, imageUrl, bio }) => {
    return (
      <div className="AboutCard">
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
      bio: "Nicholas is passionate about creating scalable web applications and solving complex technical challenges."
    },
    {
      name: "Cameron Plume",
      title: "Backend Developer",
      imageUrl: "https://ca.slack-edge.com/T02BUQQG90V-U051MD0ARNY-bb60854fb5b7-512",
      bio: "Cameron is an expert in backend development and has a strong background in building scalable systems."
    },
    {
      name: "Nandini Ghosh",
      title: "Designer & Frontend Developer",
      imageUrl: "https://ca.slack-edge.com/T02BUQQG90V-U05RT750X5W-d837b2857da5-512",
      bio: "Nandini is a talented designer and frontend developer with a keen eye for aesthetics and user experience."
    },
    {
      name: "Alex Angione",
      title: "Full Stack Developer",
      imageUrl: "https://ca.slack-edge.com/T02BUQQG90V-U054MTCKNBF-d9668c8c47a6-512",
      bio: "Alex is a full stack developer with a passion for both frontend and backend development."
    },
    {
      name: "Sebastian Tremblay",
      title: "Infrastructure & Product Manager",
      imageUrl: "https://ca.slack-edge.com/T02BUQQG90V-U06CCQ2GSNT-f79265668611-512",
      bio: "Sebastian is responsible for infrastructure and product management, ensuring smooth operations and product development."
    },
    {
      name: "Kenneth Chen",
      title: "Full Stack Developer",
      imageUrl: "https://ca.slack-edge.com/T02BUQQG90V-U041S66078R-10d4de873d8c-512",
      bio: "Kenneth is a full stack developer with a strong background in both frontend and backend development."
    }
  ];

  return (
    <div className="AboutUs">
      <div className="AboutUs__container">
        <h1 className="AboutUs__title">About GitMarks</h1>
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
        </div>

        <h2 className="AboutUs__subtitle">Our Team</h2>
        <div className="AboutUs__grid">
          {team.map((member) => (
            <AboutCard
              key={member.name}
              name={member.name}
              title={member.title}
              imageUrl={member.imageUrl}
              bio={member.bio}
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
