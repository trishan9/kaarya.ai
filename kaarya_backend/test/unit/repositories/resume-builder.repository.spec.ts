import { Types } from 'mongoose';
import { ResumeBuilderRepository } from 'src/repositories/resume-builder.repository';

describe('ResumeBuilderRepository', () => {
  const createRepository = (model: any) => new ResumeBuilderRepository(model);
  const id = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();

  it('should create resume builder with defaults', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'rb1' });
    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    const repository = createRepository(model);

    const result = await repository.create({
      studentId: new Types.ObjectId(studentId),
    });

    expect(model).toHaveBeenCalledWith({
      studentId: expect.any(Types.ObjectId),
      title: 'Untitled Resume',
      targetRole: null,
      templateId: 'professional',
      content: {},
    });
    expect(result).toEqual({ id: 'rb1' });
  });

  it('should find by id and student id with guards', async () => {
    const byIdExec = jest.fn().mockResolvedValue({ id: 'rb1' });
    const byStudentExec = jest.fn().mockResolvedValue({ id: 'rb1' });
    const model = {
      findById: jest.fn().mockReturnValue({ exec: byIdExec }),
      findOne: jest.fn().mockReturnValue({ exec: byStudentExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(id)).toEqual({ id: 'rb1' });
    expect(await repository.findByIdAndStudentId('', studentId)).toBeNull();
    expect(await repository.findByIdAndStudentId(id, '')).toBeNull();
    expect(await repository.findByIdAndStudentId(id, studentId)).toEqual({
      id: 'rb1',
    });
  });

  it('should list items by student id', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: 'rb1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(2);
    const model = {
      find: jest.fn().mockReturnValue({ sort, skip, limit, exec: findExec }),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as any;
    const repository = createRepository(model);

    const empty = await repository.findAllByStudentId({
      studentId: '',
      page: 1,
      size: 10,
    });
    const listed = await repository.findAllByStudentId({
      studentId,
      page: 2,
      size: 5,
    });

    expect(empty).toEqual({ items: [], total: 0 });
    expect(model.find).toHaveBeenCalledWith({
      studentId: expect.any(Types.ObjectId),
    });
    expect(sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(skip).toHaveBeenCalledWith(5);
    expect(limit).toHaveBeenCalledWith(5);
    expect(listed).toEqual({ items: [{ id: 'rb1' }], total: 2 });
  });

  it('should update and delete with student constraints', async () => {
    const updateExec = jest.fn().mockResolvedValue({ id: 'rb1' });
    const deleteExec = jest
      .fn()
      .mockResolvedValueOnce({ deletedCount: 1 })
      .mockResolvedValueOnce({ deletedCount: 0 });
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: updateExec }),
      deleteOne: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.update('', id, {})).toBeNull();
    expect(await repository.update(studentId, '', {})).toBeNull();

    const updated = await repository.update(studentId, id, { title: 'Updated' });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.any(Types.ObjectId), studentId: expect.any(Types.ObjectId) },
      { $set: { title: 'Updated', updatedAt: expect.any(Date) } },
      { new: true },
    );
    expect(updated).toEqual({ id: 'rb1' });

    expect(await repository.delete('', id)).toBe(false);
    expect(await repository.delete(studentId, '')).toBe(false);
    expect(await repository.delete(studentId, id)).toBe(true);
    expect(await repository.delete(studentId, id)).toBe(false);
  });
});

