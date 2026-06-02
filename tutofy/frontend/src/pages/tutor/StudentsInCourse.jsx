import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { usersAPI } from '../../api/users';

const StudentsInCourse = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      coursesAPI.getCourseById(id).catch(() => null),
      enrollmentsAPI.getCourseEnrollments(id).catch(() => ({})),
    ]).then(async ([courseData, enrData]) => {
      setCourse(courseData?.course || courseData);
      const list = Array.isArray(enrData) ? enrData : enrData?.enrollments || [];
      const withNames = await Promise.all(list.map(async (e) => {
        try {
          const u = await usersAPI.getUserById(e.user_id);
          return { ...e, student_name: u?.name || e.user_id, email: u?.email || '' };
        } catch {
          return e;
        }
      }));
      setEnrollments(withNames);
    }).finally(() => setLoading(false));
  }, [id]);

  const initials = (name) =>
    (name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/tutor/courses/${id}`}
              className="text-muted text-[13px] hover:text-body transition-colors"
            >
              ← Course Overview
            </Link>
            <div className="w-px h-5 bg-border" />
            <div>
              <p className="text-dark text-[17px] font-bold">Students</p>
              <p className="text-muted text-[12px]">{course?.title || `Course #${id}`}</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-[12px] font-semibold">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-dark text-[15px] font-semibold">
                  Enrolled Students ({enrollments.length})
                </h2>
              </div>
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted text-[13px]">
                  No students enrolled in this course yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {enrollments.map((enr, i) => {
                    const name = enr.student_name || enr.user_id || `Student ${i + 1}`;
                    const progress = enr.progress || 0;
                    return (
                      <div key={enr.id || i} className="flex items-center gap-4 px-6 py-4 hover:bg-surface transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-[13px] font-bold">{initials(name)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-dark text-[14px] font-semibold">{name}</p>
                          <p className="text-muted text-[12px]">{enr.email || ''}</p>
                        </div>
                        <div className="w-[180px]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 bg-[#f3f4f7] rounded-full h-[5px] mr-3">
                              <div
                                className="bg-primary h-[5px] rounded-full"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <span className="text-muted text-[11px]">{progress}%</span>
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                          progress >= 100
                            ? 'bg-[#22be70]/15 text-[#22be70]'
                            : progress > 0
                              ? 'bg-primary/10 text-primary'
                              : 'bg-light-muted/50 text-muted'
                        }`}>
                          {progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Enrolled'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsInCourse;
