import { Plus, UserPlus, Edit2, X, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";
import { StatCard } from "../../components/StatCard";

const initialClass = {
  name: "",
  level: "入门",
  teacher: "",
  room: "",
  capacity: 24,
};

function getCapacityRisk(current, capacity) {
  if (capacity === 0) return { level: "full", label: "无容量", color: "red" };
  const ratio = current / capacity;
  if (ratio >= 1) return { level: "full", label: "已满员", color: "red" };
  if (ratio >= 0.9) return { level: "warning", label: "接近满员", color: "orange" };
  if (ratio >= 0.7) return { level: "notice", label: "名额紧张", color: "yellow" };
  return { level: "normal", label: "名额充足", color: "green" };
}

function getRiskBadge(level, label) {
  const colors = {
    full: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    notice: "bg-yellow-100 text-yellow-700 border-yellow-200",
    normal: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`risk-badge border ${colors[level]}`}>
      {label}
    </span>
  );
}

export function ClassManager({ classes, onCreateClass, onAddStudent, onUpdateClass, onRefresh }) {
  const [classForm, setClassForm] = useState(initialClass);
  const [studentForm, setStudentForm] = useState({ classId: "", name: "", phone: "" });
  const [selectedClass, setSelectedClass] = useState(null);
  const [editForm, setEditForm] = useState({ capacity: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("");

  const totalStudents = classes.reduce((sum, item) => sum + item.students.length, 0);
  const totalCapacity = classes.reduce((sum, item) => sum + item.capacity, 0);
  const overloadedClasses = classes.filter((item) => item.students.length >= item.capacity).length;
  const warningClasses = classes.filter((item) => {
    const ratio = item.students.length / item.capacity;
    return ratio >= 0.7 && ratio < 1;
  }).length;

  const selectedClassData = selectedClass
    ? classes.find((item) => item.id === parseInt(selectedClass))
    : null;

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
    setTimeout(() => setNotice(""), 3000);
  }

  async function submitClass(event) {
    event.preventDefault();
    await onCreateClass(classForm);
    setClassForm(initialClass);
    showNotice("班级创建成功");
  }

  async function submitStudent(event) {
    event.preventDefault();
    if (!studentForm.classId) return;

    try {
      const result = await onAddStudent(studentForm.classId, {
        name: studentForm.name,
        phone: studentForm.phone,
      });
      setStudentForm({ classId: "", name: "", phone: "" });
      const remaining = result?.remaining ?? 0;
      showNotice(`学员添加成功，剩余名额: ${remaining} 人`);
    } catch (error) {
      try {
        const response = await error.response?.json?.();
        showNotice(response?.message || error.message, "error");
      } catch {
        showNotice(error.message, "error");
      }
    }
  }

  function openEditModal(item) {
    setSelectedClass(item.id.toString());
    setEditForm({ capacity: item.capacity });
    setIsEditing(true);
  }

  function closeEditModal() {
    setIsEditing(false);
    setEditForm({ capacity: 0 });
    setSelectedClass(null);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!selectedClass) return;

    try {
      await onUpdateClass(selectedClass, {
        capacity: parseInt(editForm.capacity),
      });
      closeEditModal();
      showNotice("容量更新成功");
    } catch (error) {
      try {
        const response = await error.response?.json?.();
        showNotice(response?.message || error.message, "error");
      } catch {
        showNotice(error.message, "error");
      }
    }
  }

  const selectedClassOption = classes.find(
    (item) => item.id === parseInt(studentForm.classId)
  );
  const remainingSlots = selectedClassOption
    ? selectedClassOption.capacity - selectedClassOption.students.length
    : null;

  return (
    <section className="module">
      {notice && (
        <div className={`notice ${noticeType === "error" ? "error" : "success"}`}>
          {notice}
        </div>
      )}

      <div className="metrics-grid">
        <StatCard label="班级数" value={classes.length} helper="当前系统内班级" />
        <StatCard label="学员数" value={totalStudents} helper="已分配到班级" />
        <StatCard
          label="容量利用率"
          value={`${Math.round((totalStudents / totalCapacity) * 100) || 0}%`}
          helper="按班级容量计算"
        />
        <StatCard
          label="容量风险"
          value={
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ color: "#ef4444" }}>{overloadedClasses} 已满</span>
              <span style={{ color: "#f59e0b" }}>{warningClasses} 预警</span>
            </div>
          }
          helper="容量≥70%为预警"
        />
      </div>

      <div className="two-column">
        <form className="panel" onSubmit={submitClass}>
          <SectionHeader eyebrow="Class" title="新增班级" />
          <div className="form-grid">
            <label>
              班级名称
              <input
                required
                value={classForm.name}
                onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
                placeholder="例如 JavaScript 就业班"
              />
            </label>
            <label>
              阶段
              <select
                value={classForm.level}
                onChange={(event) => setClassForm({ ...classForm, level: event.target.value })}
              >
                <option>入门</option>
                <option>进阶</option>
                <option>就业</option>
              </select>
            </label>
            <label>
              讲师
              <input
                required
                value={classForm.teacher}
                onChange={(event) => setClassForm({ ...classForm, teacher: event.target.value })}
              />
            </label>
            <label>
              教室
              <input
                required
                value={classForm.room}
                onChange={(event) => setClassForm({ ...classForm, room: event.target.value })}
              />
            </label>
            <label>
              容量
              <input
                min="1"
                type="number"
                value={classForm.capacity}
                onChange={(event) => setClassForm({ ...classForm, capacity: event.target.value })}
              />
            </label>
          </div>
          <button className="primary-action" type="submit">
            <Plus size={18} />
            创建班级
          </button>
        </form>

        <form className="panel" onSubmit={submitStudent}>
          <SectionHeader eyebrow="Student" title="添加学员" />
          <div className="form-grid">
            <label>
              所属班级
              <select
                required
                value={studentForm.classId}
                onChange={(event) => setStudentForm({ ...studentForm, classId: event.target.value })}
              >
                <option value="">选择班级</option>
                {classes.map((item) => {
                  const risk = getCapacityRisk(item.students.length, item.capacity);
                  const remaining = item.capacity - item.students.length;
                  return (
                    <option key={item.id} value={item.id} disabled={remaining <= 0}>
                      {item.name} ({item.students.length}/{item.capacity}，剩余 {remaining} 人)
                    </option>
                  );
                })}
              </select>
            </label>
            {remainingSlots !== null && (
              <div className="notice info">
                <Users size={16} />
                <span>剩余名额: <strong>{remainingSlots}</strong> 人</span>
              </div>
            )}
            <label>
              学员姓名
              <input
                required
                value={studentForm.name}
                onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
              />
            </label>
            <label>
              手机号
              <input
                value={studentForm.phone}
                onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })}
              />
            </label>
          </div>
          <button className="primary-action" type="submit" disabled={remainingSlots !== null && remainingSlots <= 0}>
            <UserPlus size={18} />
            添加学员
          </button>
        </form>
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="Roster" title="班级列表" />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>班级</th>
                <th>阶段</th>
                <th>讲师</th>
                <th>教室</th>
                <th>人数/容量</th>
                <th>容量风险</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => {
                const risk = getCapacityRisk(item.students.length, item.capacity);
                const remaining = item.capacity - item.students.length;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.students.map((student) => student.name).join("、")}</small>
                    </td>
                    <td>{item.level}</td>
                    <td>{item.teacher}</td>
                    <td>{item.room}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {item.students.length}
                      </span>
                      <span style={{ color: "#6b7280" }}>/{item.capacity}</span>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        剩余 {remaining} 人
                      </div>
                    </td>
                    <td>
                      {getRiskBadge(risk.level, risk.label)}
                    </td>
                    <td>
                      <span className="status-pill">{item.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-action small"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit2 size={14} />
                        编辑容量
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && selectedClassData && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑班级容量</h3>
              <button type="button" className="icon-button" onClick={closeEditModal}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="class-detail">
                <div className="detail-row">
                  <span className="detail-label">班级名称:</span>
                  <span className="detail-value">{selectedClassData.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">当前学员数:</span>
                  <span className="detail-value">
                    <strong>{selectedClassData.students.length}</strong> 人
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">当前容量:</span>
                  <span className="detail-value">{selectedClassData.capacity} 人</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">剩余名额:</span>
                  <span className="detail-value">
                    {selectedClassData.capacity - selectedClassData.students.length} 人
                  </span>
                </div>
              </div>
              <form onSubmit={submitEdit}>
                <label>
                  新容量
                  <input
                    type="number"
                    min={selectedClassData.students.length}
                    value={editForm.capacity}
                    onChange={(e) => setEditForm({ capacity: e.target.value })}
                    required
                  />
                  <div className="notice info" style={{ marginTop: "12px" }}>
                    <AlertTriangle size={16} />
                    <span>容量不能小于当前学员数 ({selectedClassData.students.length} 人)</span>
                  </div>
                </label>
                <div className="modal-actions">
                  <button type="button" className="secondary-action" onClick={closeEditModal}>
                    取消
                  </button>
                  <button type="submit" className="primary-action">
                    保存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
