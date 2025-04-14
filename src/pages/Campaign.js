import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Campaign.css';

const Campaign = () => {
    const campaigns = [
        {
            id: 1,
            title: "처음 입는 광복",
            company: "빙그레",
            description: "옥중 순국하여 마지막 모습이 죄수복으로 남은 독립운동가의 사진을 AI 기술로 복원하여, 독립운동 정신을 담은 빛나는 한복을 입은 영웅의 모습으로 재현하는 캠페인입니다.",
            image: "https://www.bing.co.kr/upload/ckeditor/2024/08/08a8686d-68ed-4f20-aaa8-2f2c2cb531eb",
            link: "https://www.bing.co.kr/news/news_announced_view?anno_idx=205"
        },
        {
            id: 2,
            title: "당연하지 않은 일상",
            company: "LG유플러스",
            description: "광복절을 맞아 우리의 일상이 당연하지 않은 것임을 상기시키고, 독립운동가들의 희생과 공헌을 기억하는 캠페인입니다.",
            image: "https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FoyA60%2Fbtst6jWFymF%2FEHl4Jlk4dcE69vhaw5Cp5k%2Fimg.png",
            link: "https://blog.uplus.co.kr/4547"
        },
        {
            id: 3,
            title: "독립운동가 후손 돕기",
            company: "대한적십자사",
            description: "'2021년 국가보훈대상자 생활실태조사'에 따르면 많은 독립유공자 후손들이 여전히 어려운 환경에서 살아가고 있습니다. 독립운동가 후손분들의 자긍심이 경제적 어려움에 무너지지 않도록 여러분의 따뜻한 도움의 손길을 부탁드립니다.",
            image: "https://cdn.imweb.me/thumbnail/20250107/0969ad8ef17d8.jpg",
            link: "https://redcross.campaignus.me/myfather"
        }
    ];

    return (
        <div className="campaign-container">
            <div className="campaign-header">
                <h1>광복절 기념 캠페인</h1>
            </div>
            <div className="campaign-grid">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="campaign-card">
                        <img 
                            src={campaign.image} 
                            alt={campaign.title} 
                            className="campaign-image"
                        />
                        <div className="campaign-content">
                            <div className="campaign-company">
                                <span className="company-name">{campaign.company}</span>
                            </div>
                            <h2>{campaign.title}</h2>
                            <p>{campaign.description}</p>
                            <a 
                                href={campaign.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="campaign-link"
                            >
                                자세히 보기
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Campaign;
