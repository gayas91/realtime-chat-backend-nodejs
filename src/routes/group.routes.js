const express = require('express');

const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const groupValidator = require('../validators/group.validator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(groupValidator.createGroupSchema), groupController.createGroup);
router.patch('/:groupId', validate(groupValidator.updateGroupSchema), groupController.updateGroup);
router.post(
  '/:groupId/members',
  validate(groupValidator.addMembersSchema),
  groupController.addMembers
);
router.delete(
  '/:groupId/members/:userId',
  validate(groupValidator.memberParamSchema),
  groupController.removeMember
);
router.post('/:groupId/admins', validate(groupValidator.addAdminSchema), groupController.addAdmin);
router.delete(
  '/:groupId/admins/:userId',
  validate(groupValidator.memberParamSchema),
  groupController.removeAdmin
);
router.post(
  '/:groupId/leave',
  validate(groupValidator.groupIdParamSchema),
  groupController.leaveGroup
);

module.exports = router;
