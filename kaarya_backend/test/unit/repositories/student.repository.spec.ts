import { Types } from 'mongoose';
import { StudentRepository } from 'src/repositories/student.repository';

const buildChain = <T>(value: T) => {
  const chain: any = {
    sort: jest.fn().mockImplementation(() => chain),
    skip: jest.fn().mockImplementation(() => chain),
    limit: jest.fn().mockImplementation(() => chain),
    populate: jest.fn().mockImplementation(() => chain),
    select: jest.fn().mockImplementation(() => chain),
    lean: jest.fn().mockImplementation(() => chain),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

describe('StudentRepository', () => {
  const studentId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();

  it('should create and find by student/college', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'st-1' });
    const ctor = jest.fn().mockImplementation(() => ({ save })) as any;
    ctor.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: 'st-1' }) });
    const repository = new StudentRepository(ctor);

    expect(await repository.create({} as never)).toEqual({ id: 'st-1' });

    expect(
      await repository.findByStudentAndCollege({ studentId: '', collegeId }),
    ).toBeNull();
    expect(
      await repository.findByStudentAndCollege({ studentId, collegeId }),
    ).toEqual({ id: 'st-1' });
  });

  it('should upsert memberships and handle null upsert result', async () => {
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ id: 'st-1' }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }),
    } as any;
    const repository = new StudentRepository(model);

    expect(
      await repository.upsertByStudentAndCollege(studentId, collegeId, {}),
    ).toEqual({ id: 'st-1' });
    await expect(
      repository.upsertByStudentAndCollege(studentId, collegeId, {}),
    ).rejects.toThrow('Student membership upsert failed.');
  });

  it('should list memberships by student and college with pagination', async () => {
    const byStudentChain = buildChain([{ id: 'st-1' }]);
    const byCollegeChain = buildChain([{ id: 'st-1' }]);
    const model = {
      find: jest
        .fn()
        .mockReturnValueOnce(byStudentChain)
        .mockReturnValueOnce(byCollegeChain),
      countDocuments: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(2) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(3) }),
    } as any;
    const repository = new StudentRepository(model);

    expect(
      await repository.findAllByStudentId({ studentId: '', page: 1, size: 10 }),
    ).toEqual({ students: [], total: 0 });
    const byStudent = await repository.findAllByStudentId({
      studentId,
      page: 2,
      size: 5,
    });
    expect(byStudentChain.skip).toHaveBeenCalledWith(5);
    expect(byStudentChain.limit).toHaveBeenCalledWith(5);
    expect(byStudent).toEqual({ students: [{ id: 'st-1' }], total: 2 });

    expect(
      await repository.findAllByCollegeId({ collegeId: '', page: 1, size: 10 }),
    ).toEqual({ students: [], total: 0 });
    const byCollege = await repository.findAllByCollegeId({
      collegeId,
      page: 1,
      size: 10,
    });
    expect(byCollege).toEqual({ students: [{ id: 'st-1' }], total: 3 });
  });

  it('should map student/college ids and delete memberships', async () => {
    const studentRowsChain = buildChain([{ studentId: new Types.ObjectId(studentId) }]);
    const collegeRowsChain = buildChain([{ collegeId: new Types.ObjectId(collegeId) }]);
    const model = {
      find: jest
        .fn()
        .mockReturnValueOnce(studentRowsChain)
        .mockReturnValueOnce(collegeRowsChain),
      findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ id: 'st-1' }) }),
      deleteMany: jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ deletedCount: 2 }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({}) }),
    } as any;
    const repository = new StudentRepository(model);

    expect(await repository.findStudentIdsByCollegeId('')).toEqual([]);
    expect(await repository.findStudentIdsByCollegeId(collegeId)).toEqual([
      studentId,
    ]);

    expect(await repository.findCollegeIdsByStudentId('')).toEqual([]);
    expect(await repository.findCollegeIdsByStudentId(studentId)).toEqual([
      collegeId,
    ]);

    expect(
      await repository.deleteByStudentAndCollege({ studentId: '', collegeId }),
    ).toBeNull();
    expect(
      await repository.deleteByStudentAndCollege({ studentId, collegeId }),
    ).toEqual({ id: 'st-1' });

    expect(await repository.deleteManyByCollegeId('')).toBe(0);
    expect(await repository.deleteManyByCollegeId(collegeId)).toBe(2);
    expect(await repository.deleteManyByCollegeId(collegeId)).toBe(0);
  });
});
