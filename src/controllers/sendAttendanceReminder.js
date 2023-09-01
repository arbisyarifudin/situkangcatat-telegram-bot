// Path: src/controllers/sendAttendanceReminder.js

const { allowedGroups: allGroups } = require('../configs/telegramConfig')

module.exports = async (req, res) => {
//   const bot = req.bot // get bot instance from req

  // get all groups
  const allowedGroups = allGroups

  // get all groups that have topic/thread
  const groupsWithThreadId = allowedGroups.filter(group => group.topicIds.length > 0)

  // send message to all groups
  groupsWithThreadId.forEach(group => {

    // get event type from topic/thread

  })

  res.json({ message: 'Success' })
}
