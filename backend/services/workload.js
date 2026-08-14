function calculateAssignmentWorkload(assignment) {
  return (
    assignment.job.difficulty +
    assignment.shiftGroup.difficulty
  );
}
function calculateHistoricalWorkload(history) {
  if (history.length === 0) {
    return {
      score: 0,
      totalWorkload: 0,
      assignmentCount: 0,
    };
  }

  const totalWorkload = history.reduce((total, member) => {
    return total + calculateAssignmentWorkload(member.assignment);
  }, 0);

  return {
    score: totalWorkload / history.length,
    totalWorkload,
    assignmentCount: history.length,
  };
}

function getRecencyWeight(daysAgo) {
  if (daysAgo <= 0) return 1.0;
  if (daysAgo === 1) return 0.8;
  if (daysAgo === 2) return 0.55;
  if (daysAgo === 3) return 0.35;
  if (daysAgo === 4) return 0.2;
  return 0;
}

function daysBetween(dateA, dateB) {
  const msPerDay = 86_400_000;

  const a = new Date(dateA);
  const b = new Date(dateB);

  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);

  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function calculateCurrentFatigue(history, targetDate = new Date()) {
  return history.reduce((total, member) => {
    const assignment = member.assignment;

    const workload =
      calculateAssignmentWorkload(assignment);

    const daysAgo =
      daysBetween(assignment.date, targetDate);

    if (daysAgo < 0) {
      return total;
    }

    const weight =
      getRecencyWeight(daysAgo);

    return total + workload * weight;
  }, 0);
}

module.exports = {
  calculateAssignmentWorkload,
  calculateHistoricalWorkload,
  calculateCurrentFatigue,
};