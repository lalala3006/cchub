import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFocusConfigDto } from '../dto/create-focus-config.dto';
import { FocusConfig } from '../entities/focus-config.entity';

@Injectable()
export class GithubConfigService {
  constructor(
    @InjectRepository(FocusConfig)
    private readonly configRepo: Repository<FocusConfig>,
  ) {}

  getConfig(): Promise<FocusConfig[]> {
    return this.configRepo.find({ order: { weight: 'DESC' } });
  }

  async createConfig(dto: CreateFocusConfigDto): Promise<FocusConfig> {
    const config = this.configRepo.create(dto);
    return this.configRepo.save(config);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.configRepo.delete(id);
  }

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    await this.configRepo.update(id, { weight });
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Focus config ${id} not found`);
    }

    return config;
  }
}
