import { Types } from 'mongoose';
import { ResumeRepository } from 'src/repositories/resume.repository';

describe('ResumeRepository', () => {
  const createRepository = (model: any) => new ResumeRepository(model);
  const id = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();

  it('should create resume documents', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'r1' });
    const model = jest.fn().mockImplementation(() => ({ save })) as any;
    const repository = createRepository(model);

    const created = await repository.create({ title: 'Resume' } as never);
    expect(created).toEqual({ id: 'r1' });
  });

  it('should find by id and by id + student', async () => {
    const findByIdExec = jest.fn().mockResolvedValue({ id: 'r1' });
    const findOneExec = jest.fn().mockResolvedValue({ id: 'r1' });
    const model = {
      findById: jest.fn().mockReturnValue({ exec: findByIdExec }),
      findOne: jest.fn().mockReturnValue({ exec: findOneExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.findById('')).toBeNull();
    expect(await repository.findById(id)).toEqual({ id: 'r1' });

    expect(await repository.findByIdAndStudentId('', studentId)).toBeNull();
    expect(await repository.findByIdAndStudentId(id, '')).toBeNull();
    const result = await repository.findByIdAndStudentId(id, studentId);
    expect(model.findOne).toHaveBeenCalledWith({
      _id: expect.any(Types.ObjectId),
      studentId: expect.any(Types.ObjectId),
    });
    expect(result).toEqual({ id: 'r1' });
  });

  it('should list by student id and handle empty student id', async () => {
    const findExec = jest.fn().mockResolvedValue([{ id: 'r1' }]);
    const sort = jest.fn().mockReturnThis();
    const skip = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const countExec = jest.fn().mockResolvedValue(4);
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

    expect(empty).toEqual({ resumes: [], total: 0 });
    expect(model.find).toHaveBeenCalledWith({
      studentId: expect.any(Types.ObjectId),
    });
    expect(skip).toHaveBeenCalledWith(5);
    expect(limit).toHaveBeenCalledWith(5);
    expect(listed).toEqual({ resumes: [{ id: 'r1' }], total: 4 });
  });

  it('should delete by id + student id and return boolean', async () => {
    const deleteExec = jest
      .fn()
      .mockResolvedValueOnce({ id: 'r1' })
      .mockResolvedValueOnce(null);
    const model = {
      findOneAndDelete: jest.fn().mockReturnValue({ exec: deleteExec }),
    } as any;
    const repository = createRepository(model);

    expect(await repository.deleteByIdAndStudentId('', studentId)).toBe(false);
    expect(await repository.deleteByIdAndStudentId(id, '')).toBe(false);
    expect(await repository.deleteByIdAndStudentId(id, studentId)).toBe(true);
    expect(await repository.deleteByIdAndStudentId(id, studentId)).toBe(false);
  });
});

