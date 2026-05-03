import React from 'react';
import './Skeleton.css';

export const SkeletonBlock = ({ width = '100%', height = '20px', radius = '8px', style = {} }) => (
    <div className="skeleton-block" style={{ width, height, borderRadius: radius, ...style }}></div>
);

export const SkeletonCircle = ({ size = '50px' }) => (
    <div className="skeleton-block skeleton-circle" style={{ width: size, height: size }}></div>
);

export const SkeletonCard = ({ lines = 3 }) => (
    <div className="skeleton-card">
        <div className="skeleton-header">
            <SkeletonCircle size="48px" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <SkeletonBlock width="60%" height="16px" />
                <SkeletonBlock width="40%" height="12px" />
            </div>
        </div>
        <div className="skeleton-body">
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBlock key={i} width={`${85 - (i * 15)}%`} height="14px" />
            ))}
        </div>
    </div>
);

export const SkeletonDashboard = () => (
    <div className="skeleton-dashboard">
        <div className="skeleton-header-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SkeletonBlock width="250px" height="28px" />
                <SkeletonBlock width="150px" height="14px" />
            </div>
            <SkeletonBlock width="120px" height="40px" radius="10px" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
    </div>
);

