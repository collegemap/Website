import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  School,
  ArrowLeft
} from 'lucide-react';
import iithData from '../../IIT DATA/iith.json';
import iitpData from '../../IIT DATA/iitp.json';
import iitbbsData from '../../IIT DATA/iitbbs.json';
import iitmdData from '../../IIT DATA/iitmd.json';
import iitiData from '../../IIT DATA/iiti.json';
import iitbhuData from '../../IIT DATA/iitbhu.json';
import iittData from '../../IIT DATA/iitt.json';
import iitismData from '../../IIT DATA/iitism.json';
import iitbhData from '../../IIT DATA/iitbh.json';
import iitdhData from '../../IIT DATA/iitdh.json';
import iitjmuData from '../../IIT DATA/iitjmu.json';
import iitgoaData from '../../IIT DATA/iitgoa.json';
import { getImageUrl } from '../../utils/imageLoader';
import "./AboutIITs.css";

// --- COMPONENTS ---

const SectionTitle = ({ title, icon: Icon }) => (
  <div className="iit-section-title">
    <div className="iit-title-icon-wrapper">
      <Icon size={24} />
    </div>
    <h2>{title.replace(/_/g, ' ')}</h2>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`iit-card ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  return (
    <span className={`iit-badge iit-badge-${color}`}>
      {children}
    </span>
  );
};

// --- SUB-SECTIONS ---

const OverviewSection = ({ data }) => (
  <div className="iit-overview-grid">
    <Card className="iit-overview-card">
      <h3 className="iit-card-header">
        <School className="iit-icon-blue" /> Institute Details
      </h3>
      <div className="iit-details-list">
        <div className="iit-detail-row">
          <span className="label">Name</span>
          <span className="value">{data.institute}</span>
        </div>
        <div className="iit-detail-row">
          <span className="label">Program</span>
          <span className="value">{data.program_type}</span>
        </div>
        <div className="iit-detail-row">
          <span className="label">NIRF Ranking</span>
          <span className="value highlight-blue">{data["NIRF Engineering Rankings"]}</span>
        </div>
      </div>
    </Card>

    <Card className="iit-overview-card">
      <h3 className="iit-card-header">
        <BookOpen className="iit-icon-blue" /> Courses Offered
      </h3>
      <div className="iit-tags-container">
        {data.courses_offered.map((course, idx) => (
          <Badge key={idx} color="slate">{course}</Badge>
        ))}
      </div>
    </Card>
  </div>
);

const PlacementsSection = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState(data[0].year);
  const currentYearData = data.find(p => p.year === selectedYear) || data[0];

  const maxStudents = Math.max(...currentYearData.programs.map(p => p.participated));

  return (
    <div className="placements-section">
      <div className="iit-year-tabs">
        {data.map(item => (
          <button
            key={item.year}
            onClick={() => setSelectedYear(item.year)}
            className={`iit-tab-btn ${selectedYear === item.year ? 'active' : ''}`}
          >
            Batch {item.year}
          </button>
        ))}
      </div>



      <div className="iit-stats-grid">
        {currentYearData.programs.map((prog, idx) => (
          <Card key={idx} className="iit-stat-card">
            <div className="iit-branch-label">{prog.branch}</div>
            <div className="stat-content">
              <div className="iit-stat-row">
                <span className="iit-stat-label">Placement Rate</span>
                <span className="stat-value iit-text-green">{prog.placement_rate}%</span>
              </div>
              <div className="iit-progress-bar-bg">
                <div className="iit-progress-bar-fill" style={{ width: `${prog.placement_rate}%` }}></div>
              </div>
              <div className="iit-stat-footer">
                <div className="stat-box">
                  <div className="iit-sub-label">Avg Package</div>
                  <div className="iit-sub-value">{prog.avg_package_lpa} LPA</div>
                </div>
                <div className="stat-box iit-text-right">
                  <div className="iit-sub-label">Highest</div>
                  <div className="iit-sub-value">{prog.highest_package_lpa} LPA</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Placement Overview Graph */}
      <Card className="iit-placement-graph-card">
        <h3 className="iit-graph-title">Placement Overview: {currentYearData.year}</h3>
        <div className="iit-graph-legend">
          <span className="iit-legend-item">
            <span className="iit-legend-box iit-legend-registered"></span>
            Registered
          </span>
          <span className="iit-legend-item">
            <span className="iit-legend-box iit-legend-placed"></span>
            Placed
          </span>
        </div>
        <div className="iit-placement-chart">
          {currentYearData.programs.map((prog, idx) => {
            const branchAbbr = prog.branch
              .split(' ')
              .filter(w => w.toLowerCase() !== 'and')
              .map(w => w[0].toUpperCase())
              .join('');

            return (
              <div key={idx} className="iit-chart-bar-group">
                <div className="iit-chart-bars">
                  <div className="iit-bar-wrapper">
                    <div
                      className="iit-bar iit-bar-registered"
                      style={{ height: `${(prog.participated / maxStudents) * 100}%` }}
                    >
                      <span className="iit-bar-value">{prog.participated}</span>
                    </div>
                    <div
                      className="iit-bar iit-bar-placed"
                      style={{ height: `${(prog.placed / maxStudents) * 100}%` }}
                    >
                      <span className="iit-bar-value">{prog.placed}</span>
                    </div>
                  </div>
                  <div className="iit-chart-label">
                    <div className="iit-chart-branch">{branchAbbr}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const SeatMatrixSection = ({ data }) => {
  const grouped = useMemo(() => {
    const groups = {};
    data.forEach(item => {
      if (!groups[item.program]) groups[item.program] = [];
      groups[item.program].push(item);
    });
    return groups;
  }, [data]);

  return (
    <div className="iit-seat-matrix-container">
      {Object.entries(grouped).map(([program, items]) => (
        <Card key={program} className="iit-matrix-card">
          <div className="iit-matrix-header">
            <h3>{program}</h3>
            <span className="iit-total-seats">Total Seats: {items.reduce((acc, curr) => acc + curr.seats.total, 0)}</span>
          </div>
          <div className="iit-table-wrapper">
            <table className="iit-data-table">
              <thead>
                <tr>
                  <th className="th-category">Category</th>
                  <th>Total</th>
                  <th>OPEN</th>
                  <th>EWS</th>
                  <th>OBC-NCL</th>
                  <th>SC</th>
                  <th>ST</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="td-category">
                      {row.type === 'Female-only' ? (
                        <span className="iit-category-tag iit-text-pink">
                          <Users size={14} /> Female Supernumerary
                        </span>
                      ) : (
                        <span className="iit-category-tag iit-text-blue">
                          <Users size={14} /> Gender Neutral
                        </span>
                      )}
                    </td>
                    <td className="iit-td-bold">{row.seats.total}</td>
                    <td>{row.seats.open}</td>
                    <td>{row.seats.gen_ews}</td>
                    <td>{row.seats.obc_ncl}</td>
                    <td>{row.seats.sc}</td>
                    <td>{row.seats.st}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

const CutoffSection = ({ data }) => {
  const [year, setYear] = useState("2025");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Get unique branches and categories
  const { branches, categories } = useMemo(() => {
    const list = data[year] || [];
    const branchSet = new Set(list.map(item => item.program));
    const categorySet = new Set(list.map(item => item.category));
    return {
      branches: Array.from(branchSet).sort(),
      categories: Array.from(categorySet).sort()
    };
  }, [data, year]);

  const filteredData = useMemo(() => {
    const list = data[year] || [];
    return list.filter(item => {
      const branchMatch = !selectedBranch || item.program === selectedBranch;
      const categoryMatch = !selectedCategory || item.category === selectedCategory;
      return branchMatch && categoryMatch;
    });
  }, [data, year, selectedBranch, selectedCategory]);

  return (
    <Card className="iit-cutoff-card">
      <div className="iit-cutoff-header">
        <div className="iit-year-selector">
          {Object.keys(data).sort().reverse().map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`iit-filter-btn ${year === y ? 'active' : ''}`}
            >
              {y} Cutoffs
            </button>
          ))}
        </div>

        <div className="iit-filters-row">
          <div className="iit-filter-group">
            <label className="iit-filter-label">Branch</label>
            <select
              className="iit-filter-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className="iit-filter-group">
            <label className="iit-filter-label">Category</label>
            <select
              className="iit-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {(selectedBranch || selectedCategory) && (
            <button
              className="iit-clear-filters-btn"
              onClick={() => {
                setSelectedBranch("");
                setSelectedCategory("");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="iit-table-scroll-container">
        <table className="iit-cutoff-table">
          <thead>
            <tr className="iit-table-main-header">
              <th rowSpan="2">Program</th>
              <th rowSpan="2">Category</th>
              <th rowSpan="2">Quota</th>
              <th colSpan="2" className="iit-round-header iit-round-1">Round 1</th>
              <th colSpan="2" className="iit-round-header iit-round-last">Last Round</th>
            </tr>
            <tr className="iit-table-sub-header">
              <th className="iit-text-right iit-sub-col">Opening</th>
              <th className="iit-text-right iit-sub-col">Closing</th>
              <th className="iit-text-right iit-sub-col">Opening</th>
              <th className="iit-text-right iit-sub-col">Closing</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((row, idx) => (
              <tr key={idx} className="iit-cutoff-row">
                <td className="iit-td-program">{row.program}</td>
                <td className="iit-td-category">
                  <Badge color={row.category.includes('OPEN') ? 'blue' : 'amber'}>{row.category}</Badge>
                </td>
                <td className="iit-td-quota">{row.gender}</td>
                <td className="iit-text-right iit-font-mono iit-rank-cell">{row.round_1_opening_rank}</td>
                <td className="iit-text-right iit-font-mono iit-rank-cell iit-rank-closing">{row.round_1_closing_rank}</td>
                <td className="iit-text-right iit-font-mono iit-rank-cell">{row.last_round_opening_rank}</td>
                <td className="iit-text-right iit-font-mono iit-rank-cell iit-rank-final">{row.last_round_closing_rank}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="iit-no-data">
                  No records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- MAIN SCREENS ---

const SelectionScreen = ({ onSelect }) => {
  return (
    <div className="iit-selection-screen">
      <div className="iit-background-shapes">
        <div className="iit-shape iit-shape-1"></div>
        <div className="iit-shape iit-shape-2"></div>
      </div>

      <div className="iit-selection-content">
        <div className="iit-selection-header">
          <div className="logo-box">

          </div>
          <h1>CollegeMap</h1>
          <p>By IITians for Future IITians</p>
        </div>

        <div className="iit-selection-card">
          <label>Select Target Institute</label>
          <div className="iit-select-wrapper">
            <select
              onChange={(e) => onSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Choose an IIT...</option>
              <option value="iith">IIT Hyderabad</option>
              <option value="iitp">IIT Patna</option>
              <option value="iitbbs">IIT Bhubaneswar</option>
              <option value="iitmd">IIT Mandi</option>
              <option value="iiti">IIT Indore</option>
              <option value="iitbhu">IIT BHU</option>
              <option value="iitt">IIT Tirupati</option>
              <option value="iitism">IIT ISM Dhanbad</option>
              <option value="iitbh">IIT Bhilai</option>
              <option value="iitdh">IIT Dharwad</option>
              <option value="iitjmu">IIT Jammu</option>
              <option value="iitgoa">IIT Goa</option>
            </select>
            <ChevronRight className="iit-select-arrow" />
          </div>
          <p className="iit-helper-text">
            Select an institute to view detailed analytics, placements, and cutoffs.
          </p>
        </div>
      </div>
    </div>
  );
};

const CollegeDashboard = ({ data, onBack }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: School },
    { id: 'placements', label: 'Placements', icon: TrendingUp },
    { id: 'seats', label: 'Seat Matrix', icon: Users },
    { id: 'cutoffs', label: 'Cutoffs', icon: Award },
  ];

  return (
    <div className="iit-dashboard-container">
      {/* Hero Header */}
      <div className="iit-hero-section" style={{ backgroundImage: `url(${getImageUrl(data.hero_image, 'hero')})` }}>
        <div className="iit-hero-content">
          <div className="iit-hero-flex">
            <div className="iit-college-icon-large">
              <img src={getImageUrl(data.logo_image, 'logo')} alt={data.institute + ' Logo'} />
            </div>
            <div className="iit-hero-text">
              <h1>{data.institute}</h1>
              <div className="iit-hero-badges">
                <span className="iit-hero-badge primary">
                  Rank {data["NIRF Engineering Rankings"].split(' ')[0]}
                </span>
                <span className="iit-hero-badge secondary">
                  Kerala, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navbar */}
        <nav className="iit-college-dashboard-navbar">
          <div className="iit-college-dashboard-navbar-inner">
            <button onClick={onBack} className="iit-college-back-btn">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <div className="iit-college-nav-links">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`iit-college-nav-link ${activeSection === item.id ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="iit-main-content">

        <section id="overview" className="iit-section-block">
          <SectionTitle title="Overview" icon={School} />
          <OverviewSection data={data} />
        </section>

        <section id="placements" className="iit-section-block">
          <SectionTitle title="Placement Statistics" icon={TrendingUp} />
          <PlacementsSection data={data.placements} />
        </section>

        <section id="seats" className="iit-section-block">
          <SectionTitle title="Seat Matrix (2025)" icon={Users} />
          <SeatMatrixSection data={data.seat_matrix_2025} />
        </section>

        <section id="cutoffs" className="iit-section-block">
          <SectionTitle title="Opening & Closing Ranks" icon={Award} />
          <CutoffSection data={data.cutoffs} />
        </section>

      </main>
    </div>
  );
};

export default function App() {
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Map selection to data
  const getCollegeData = (college) => {
    switch (college) {
      case 'iith': return iithData;
      case 'iitp': return iitpData;
      case 'iitbbs': return iitbbsData;
      case 'iitmd': return iitmdData;
      case 'iiti': return iitiData;
      case 'iitbhu': return iitbhuData;
      case 'iitt': return iittData;
      case 'iitism': return iitismData;
      case 'iitbh': return iitbhData;
      case 'iitdh': return iitdhData;
      case 'iitjmu': return iitjmuData;
      case 'iitgoa': return iitgoaData;
      default: return null;
    }
  };

  return (
    <div className="app-root">
      {selectedCollege ? (
        <CollegeDashboard
          data={getCollegeData(selectedCollege)}
          onBack={() => setSelectedCollege(null)}
        />
      ) : (
        <SelectionScreen onSelect={setSelectedCollege} />
      )}
    </div>
  );
}