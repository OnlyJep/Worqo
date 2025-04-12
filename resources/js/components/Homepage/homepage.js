import React from 'react';
import "./../../../sass/components/homepage.scss";
import Headerz from "../HeaderContent/Headerz";

// Importing Tabler Icons
import { IconArrowLeft, IconSearch, IconStar, IconDeviceLaptop, IconShirt, IconBook, IconLamp, IconBallFootball, IconTrendingUp } from '@tabler/icons-react';

// Placeholder imports for the shapes (replace with your actual SVGs)
import TopRightShape from "../../../../resources/sass/img/top_right_shape.svg";
import CenterLeftShape from "../../../../resources/sass/img/center_left_shape.svg";

const HomePage = () => {
  return (
    <div className="homepage">
      <Headerz />
      {/* Background Shapes */}
      <div className="top-right-shape">
        <img src={TopRightShape} alt="Top Right Shape" />
      </div>
      <div className="center-left-shape">
        <img src={CenterLeftShape} alt="Center Left Shape" />
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="content">
          <h1>
            Give Your Items a <br />
            <span>NextUse</span> – Sell and Earn!
          </h1>

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for Second-Hand Treasures"
            />
            <button className="search-button">
              <IconSearch size={24} />
            </button>
          </div>

          {/* Category Icons */}
          <div className="categories">
            <div className="category-item">
              <IconArrowLeft size={24} />
              <span>Furniture</span>
            </div>
            <div className="category-item">
              <IconDeviceLaptop size={24} />
              <span>Electronics</span>
            </div>
            <div className="category-item">
              <IconShirt size={24} />
              <span>Clothing</span>
            </div>
            <div className="category-item">
              <IconBook size={24} />
              <span>Books</span>
            </div>
            <div className="category-item">
              <IconLamp size={24} />
              <span>Home Decor</span>
            </div>
            <div className="category-item">
              <IconBallFootball size={24} />
              <span>Toys & Games</span>
            </div>
            <div className="category-item">
              <IconBallFootball size={24} />
              <span>Sports Equipment</span>
            </div>
            <div className="category-item">
              <IconTrendingUp size={24} />
              <span>Trending</span>
            </div>
          </div>

          {/* Featured Categories Buttons */}
          <div className="featured-categories">
            <button>Vintage Furniture</button>
            <button>Smartphones</button>
            <button>Rare Books</button>
            <button>Handmade Decor</button>
            <button>Toys</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;