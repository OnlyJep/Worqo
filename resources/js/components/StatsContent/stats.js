import React from 'react';
import "./../../../sass/components/HomepageStyles/stats.scss";
import { IconCheck } from '@tabler/icons-react';
import statsImage from '../../../../resources/sass/img/HomepageImgs/stats_img.svg';

const Stats = () => {
  return (
    <div className="stats">
      <div className="stats-container" style={{ backgroundImage: `url(${statsImage})` }}>
        <div className="stats-content">
          <h2>Services for You</h2>
          <ul>
            <li>
              <IconCheck size={20} className="check-icon" />
              List your items in minutes with our simple upload tool.
            </li>
            <li>
              <IconCheck size={20} className="check-icon" />
              Secure payments and buyer-seller communication for peace of mind.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Stats;