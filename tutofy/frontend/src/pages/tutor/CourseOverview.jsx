import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import TopBarActions from '../../components/ui/TopBarActions';

const CourseOverview = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      coursesAPI.getCourseById(id).catch(() => null),
      enrollmentsAPI.getCourseEnrollments(id).catch(() => []),
    ]).then(([courseData, enrData]) => {
      setCourse(courseData);
      setEnrollments(Array.isArray(enrData) ? enrData : []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await coursesAPI.deleteCourse(id);
      navigate('/tutor/courses');
    } catch {
      setDeleting(false);
    }
  };

  const initials = (name) =>
    (name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tutor/courses')}
              className="text-muted text-[13px] hover:text-body transition-colors"
            >
              ← Back
            </button>
            <div className="w-px h-5 bg-border" />
            <div>
              <p className="text-dark text-[17px] font-bold">{loading ? 'Loading...' : (course?.title || 'Course')}</p>
              <p className="text-muted text-[12px]">Course overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {course && (
              <>
                <Link
                  to={`/tutor/courses/${id}/edit`}
                  className="bg-[#f3f4f7] text-body text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-surface transition-colors"
                >
                  Edit Course
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[#f24545] text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f24545]/10 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !course ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>
              </div>
              <p className="text-dark text-[17px] font-semibold mb-2">Course not found</p>
              <Link to="/tutor/courses" className="text-primary text-[14px] font-medium">Go back to courses</Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-3 gap-6">
              {/* Course Details */}
              <div className="col-span-2 space-y-5">
                <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[16px] bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-[18px] font-bold">
                          {(course.title || 'C').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-dark text-[20px] font-bold">{course.title}</h1>
                        <p className="text-muted text-[13px] mt-0.5">{course.subject || 'General'}</p>
                      </div>
                    </div>
                    <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full ${
                      course.is_published
                        ? 'bg-[#22be70]/15 text-[#22be70]'
                        : 'bg-light-muted/50 text-muted'
                    }`}>
                      {course.is_published ? 'published' : 'draft'}
                    </span>
                  </div>
                  {course.description && (
                    <p className="text-body text-[14px] leading-relaxed">{course.description}</p>
                  )}
                  <div className="mt-5 pt-5 border-t border-border flex items-center gap-6">
                    <div>
                      <p className="text-muted text-[12px] mb-1">Price</p>
                      <p className="text-dark text-[15px] font-bold">
                        {course.price ? `${course.price.toLocaleString()} KZT` : 'Free'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-[12px] mb-1">Level</p>
                      <p className="text-dark text-[15px] font-semibold capitalize">
                        {course.level || 'Beginner'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-[12px] mb-1">Students</p>
                      <p className="text-dark text-[15px] font-bold">{enrollments.length}</p>
                    </div>
                  </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-dark text-[15px] font-semibold">
                      Enrolled Students ({enrollments.length})
                    </h2>
                  </div>
                  {enrollments.length === 0 ? (
                    <p className="text-center py-8 text-muted text-[13px]">No students enrolled yet</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {enrollments.map((enr, i) => {
                        const name = enr.student_name || `Student ${i + 1}`;
                        const progress = enr.progress || 0;
                        return (
                          <div key={enr.id || i} className="flex items-center gap-4 py-4">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-[12px] font-bold">{initials(name)}</span>
                            </div>
                            <p className="text-dark text-[13px] font-medium flex-1">{name}</p>
                            <div className="flex items-center gap-3 w-[160px]">
                              <div className="flex-1 bg-[#f3f4f7] rounded-full h-[5px]">
                                <div
                                  className="bg-primary h-[5px] rounded-full"
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                              <span className="text-muted text-[11px] w-8 text-right">{progress}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Sidebar */}
              <div className="space-y-5">
                <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-5">
                  <h2 className="text-dark text-[15px] font-semibold mb-4">Actions</h2>
                  <div className="space-y-3">
                    <Link
                      to={`/tutor/courses/${id}/edit`}
                      className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-[12px] transition-colors"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary flex-shrink-0"><path d="M14 3l3 3L7 16H4v-3L14 3z" strokeLinejoin="round"/></svg>
                      <span className="text-dark text-[13px] font-medium">Edit Course</span>
                    </Link>
                    <Link
                      to={`/tutor/courses/${id}/students`}
                      className="flex items-center gap-3 p-3 bg-[#22be70]/5 hover:bg-[#22be70]/10 rounded-[12px] transition-colors"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[#22be70] flex-shrink-0"><circle cx="7" cy="7" r="3"/><path d="M1 18a6 6 0 0112 0"/><circle cx="14" cy="8" r="2.5"/><path d="M14 13a4 4 0 013.5 4"/></svg>
                      <span className="text-dark text-[13px] font-medium">Manage Students</span>
                    </Link>
                    <Link
                      to="/tutor/grading"
                      className="flex items-center gap-3 p-3 bg-[#ffa61a]/5 hover:bg-[#ffa61a]/10 rounded-[12px] transition-colors"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[#ffa61a] flex-shrink-0"><path d="M4 2h9l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v4h4M7 9h6M7 12h6M7 15h3" strokeLinecap="round"/></svg>
                      <span className="text-dark text-[13px] font-medium">Grade Assignments</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOverview;
